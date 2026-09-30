import crypto from 'crypto';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { stripeConfig } from '../../config/payment';
import Stripe from 'stripe';

export async function validateCoupon(code: string, planId: string, userId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new AppError('Invalid coupon code', 404);
  }

  if (!coupon.isActive) {
    throw new AppError('Coupon is no longer active', 400);
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError('Coupon has expired', 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('Coupon usage limit reached', 400);
  }

  const usageCount = await prisma.couponUsage.count({
    where: { couponId: coupon.id, userId },
  });

  if (usageCount >= coupon.perUserLimit) {
    throw new AppError('You have already used this coupon', 400);
  }

  if (coupon.applicablePlans) {
    const applicablePlans = coupon.applicablePlans as string[];
    if (!applicablePlans.includes(planId)) {
      throw new AppError('Coupon not applicable to this plan', 400);
    }
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  let discountAmount: number;
  let finalAmount: number;

  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = plan.price * (coupon.discountValue / 100);
    finalAmount = plan.price - discountAmount;
  } else {
    discountAmount = Math.min(coupon.discountValue, plan.price);
    finalAmount = Math.max(0, plan.price - coupon.discountValue);
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: Math.round(discountAmount * 100) / 100,
    originalAmount: plan.price,
    finalAmount: Math.round(finalAmount * 100) / 100,
    currency: plan.currency,
  };
}

export async function handleStripeWebhook(payload: Buffer, signature: string) {
  const stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    stripeConfig.webhookSecret
  );

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentId = paymentIntent.metadata?.paymentId;

    if (paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { subscription: true },
      });

      if (payment && payment.status === 'PENDING') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETED',
              gatewayTransactionId: paymentIntent.id,
            },
          }),
          ...(payment.subscription
            ? [
                prisma.subscription.update({
                  where: { id: payment.subscription.id },
                  data: { status: 'ACTIVE' },
                }),
              ]
            : []),
          ...(payment.couponId
            ? [
                prisma.coupon.update({
                  where: { id: payment.couponId },
                  data: { usedCount: { increment: 1 } },
                }),
                prisma.couponUsage.create({
                  data: {
                    couponId: payment.couponId,
                    userId: payment.userId,
                    paymentId: payment.id,
                  },
                }),
              ]
            : []),
        ]);
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentId = paymentIntent.metadata?.paymentId;

    if (paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { subscription: true },
      });

      if (payment && payment.status === 'PENDING') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'FAILED',
              metadata: {
                failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              },
            },
          }),
          ...(payment.subscription
            ? [
                prisma.subscription.update({
                  where: { id: payment.subscription.id },
                  data: { status: 'CANCELLED' },
                }),
              ]
            : []),
        ]);
      }
    }
  }

  return { received: true };
}

export async function handleChapaWebhook(payload: any, signature?: string) {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (secret && signature) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new AppError('Invalid Chapa webhook signature', 401);
    }
  }

  const { event, data } = payload;

  if (event === 'charge.completed' && data.status === 'success') {
    const txRef = data.tx_ref;
    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId: txRef },
      include: { subscription: true },
    });

    if (payment && payment.status === 'PENDING') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            gatewayTransactionId: data.transaction_id || txRef,
          },
        }),
        ...(payment.subscription
          ? [
              prisma.subscription.update({
                where: { id: payment.subscription.id },
                data: { status: 'ACTIVE' },
              }),
            ]
          : []),
        ...(payment.couponId
          ? [
              prisma.coupon.update({
                where: { id: payment.couponId },
                data: { usedCount: { increment: 1 } },
              }),
              prisma.couponUsage.create({
                data: {
                  couponId: payment.couponId,
                  userId: payment.userId,
                  paymentId: payment.id,
                },
              }),
            ]
          : []),
      ]);
    }
  }

  return { received: true };
}

export async function handleTelebirrCallback(payload: any, signature?: string) {
  const secret = process.env.TELEBIRR_APP_SECRET;
  if (secret && signature) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new AppError('Invalid Telebirr webhook signature', 401);
    }
  }

  const { merchantOrderNo, tradeStatus, tradeNo } = payload;

  const payment = await prisma.payment.findFirst({
    where: { gatewayTransactionId: merchantOrderNo },
    include: { subscription: true },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.status !== 'PENDING') {
    return { received: true };
  }

  if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayTransactionId: tradeNo || merchantOrderNo,
        },
      }),
      ...(payment.subscription
        ? [
            prisma.subscription.update({
              where: { id: payment.subscription.id },
              data: { status: 'ACTIVE' },
            }),
          ]
        : []),
      ...(payment.couponId
        ? [
            prisma.coupon.update({
              where: { id: payment.couponId },
              data: { usedCount: { increment: 1 } },
            }),
            prisma.couponUsage.create({
              data: {
                couponId: payment.couponId,
                userId: payment.userId,
                paymentId: payment.id,
              },
            }),
          ]
        : []),
    ]);
  } else if (tradeStatus === 'TRADE_FAILED' || tradeStatus === 'TRADE_CLOSED') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: { failureReason: tradeStatus },
        },
      }),
      ...(payment.subscription
        ? [
            prisma.subscription.update({
              where: { id: payment.subscription.id },
              data: { status: 'CANCELLED' },
            }),
          ]
        : []),
    ]);
  }

  return { received: true };
}

export async function getPaymentHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: {
              select: { name: true, durationMonths: true },
            },
          },
        },
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return { payments, total, page, limit };
}

export async function getPaymentById(paymentId: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      coupon: {
        select: { code: true, discountType: true, discountValue: true },
      },
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
}

export async function getAllPayments(
  page: number,
  limit: number,
  status?: string,
  gateway?: string
) {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (gateway) where.gateway = gateway;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        subscription: {
          include: {
            plan: {
              select: { name: true, durationMonths: true },
            },
          },
        },
        coupon: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

export async function refundPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status === 'REFUNDED') throw new AppError('Payment already refunded', 400);
  if (payment.status !== 'COMPLETED') throw new AppError('Only completed payments can be refunded', 400);

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'REFUNDED' },
  });

  return { payment: updated, message: 'Payment refunded successfully' };
}
