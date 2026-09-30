import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { sendPushToDevices } from '../../utils/push';
import { sendSubscriptionReminder } from '../../utils/email';
import { stripeConfig, chapaConfig, telebirrConfig } from '../../config/payment';
import { env } from '../../config/environment';
import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });
}

export async function getPlansAll() {
  return prisma.subscriptionPlan.findMany({
    orderBy: { price: 'asc' },
  });
}

export async function getPlanById(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    throw new AppError('Subscription plan not found', 404);
  }

  return plan;
}

export async function createPlan(data: {
  name: string;
  durationMonths: number;
  price: number;
  currency?: string;
  features?: any;
  isActive?: boolean;
}) {
  return prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      durationMonths: data.durationMonths,
      price: data.price,
      currency: data.currency || 'USD',
      features: data.features,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    durationMonths?: number;
    price?: number;
    currency?: string;
    features?: any;
    isActive?: boolean;
  }
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    throw new AppError('Subscription plan not found', 404);
  }

  return prisma.subscriptionPlan.update({
    where: { id },
    data,
  });
}

export async function deletePlan(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { subscriptions: { where: { status: 'ACTIVE' } } },
  });

  if (!plan) {
    throw new AppError('Subscription plan not found', 404);
  }

  if (plan.subscriptions.length > 0) {
    throw new AppError('Cannot delete plan with active subscriptions. Deactivate it instead.', 400);
  }

  return prisma.subscriptionPlan.delete({ where: { id } });
}

export async function subscribe(
  userId: string,
  planId: string,
  couponCode: string | undefined,
  gateway: 'TELEBIRR' | 'STRIPE' | 'CHAPA'
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.isActive) {
    throw new AppError('Subscription plan not found or inactive', 404);
  }

  let finalAmount = plan.price;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      throw new AppError('Invalid coupon code', 400);
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

    if (coupon.discountType === 'PERCENTAGE') {
      finalAmount = plan.price * (1 - coupon.discountValue / 100);
    } else {
      finalAmount = Math.max(0, plan.price - coupon.discountValue);
    }

    couponId = coupon.id;
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: finalAmount,
      currency: plan.currency,
      gateway,
      status: 'PENDING',
      couponId,
    },
  });

  let paymentUrl: string | null = null;
  let checkoutInfo: any = null;

  if (gateway === 'STRIPE') {
    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2025-02-24.acacia',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: `${plan.durationMonths} months subscription`,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/payment/cancel`,
      metadata: {
        paymentId: payment.id,
        userId,
        planId,
      },
    });

    paymentUrl = session.url;
    checkoutInfo = { sessionId: session.id };

    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayTransactionId: session.id },
    });
  } else if (gateway === 'CHAPA') {
    const txRef = `chapa-${payment.id}-${Date.now()}`;

    const response = await axios.post(
      `${chapaConfig.baseUrl}/transaction/initialize`,
      {
        amount: finalAmount,
        currency: plan.currency,
        email: 'user@example.com',
        first_name: 'User',
        last_name: 'Naik',
        tx_ref: txRef,
        callback_url: `${env.APP_URL}/api/v1/payments/webhooks/chapa`,
        return_url: `${env.APP_URL}/payment/success`,
        customization: {
          title: 'Naik Subscription',
          description: `${plan.name} - ${plan.durationMonths} months`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${chapaConfig.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    paymentUrl = response.data.data.checkout_url;
    checkoutInfo = { txRef };

    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayTransactionId: txRef },
    });
  } else if (gateway === 'TELEBIRR') {
    const nonce = Date.now().toString();
    const timestamp = new Date().toISOString();

    const payload = {
      appId: telebirrConfig.merchantId,
      appKey: telebirrConfig.appKey,
      merchantOrderNo: payment.id,
      totalAmount: Math.round(finalAmount * 100),
      currency: plan.currency,
      nonce,
      timestamp,
      notifyUrl: `${env.APP_URL}/api/v1/payments/webhooks/telebirr`,
      returnUrl: `${env.APP_URL}/payment/success`,
      cancelUrl: `${env.APP_URL}/payment/cancel`,
    };

    const signData = Object.keys(payload)
      .sort()
      .map((key) => `${key}=${(payload as any)[key]}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', telebirrConfig.appSecret)
      .update(signData)
      .digest('hex');

    const response = await axios.post(
      `${telebirrConfig.baseUrl}/api/open/v3/trade/precreate`,
      {
        ...payload,
        sign: signature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    paymentUrl = response.data.data.toPayUrl;
    checkoutInfo = { merchantOrderNo: payment.id };

    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayTransactionId: payment.id },
    });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      startDate,
      endDate,
      status: 'PENDING' as any,
      paymentId: payment.id,
    },
  });

  return {
    paymentId: payment.id,
    subscriptionId: subscription.id,
    amount: finalAmount,
    currency: plan.currency,
    gateway,
    paymentUrl,
    checkoutInfo,
  };
}

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    include: {
      plan: true,
    },
    orderBy: { endDate: 'desc' },
  });

  return subscription;
}

export async function getSubscriptionHistory(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      plan: true,
      payment: {
        select: {
          amount: true,
          currency: true,
          gateway: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function checkSubscriptionActive(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
  });

  return !!subscription;
}

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE', endDate: { gte: new Date() } },
  });
  if (!subscription) {
    throw new AppError('Active subscription not found', 404);
  }
  return prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'CANCELLED' as any },
  });
}

export async function renewSubscriptionReminder() {
  const now = new Date();
  const reminderDays = [7, 3, 1];

  for (const days of reminderDays) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            fcmToken: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const subscription of subscriptions) {
      const { user, plan } = subscription;

      if (user.fcmToken) {
        await sendPushToDevices([user.fcmToken], {
          title: 'Subscription Expiring Soon',
          body: `Your ${plan.name} subscription expires in ${days} day(s). Renew now!`,
          data: {
            type: 'subscription_reminder',
            subscriptionId: subscription.id,
            daysLeft: days.toString(),
          },
        });
      }

      if (user.email) {
        await sendSubscriptionReminder(user.email, plan.name, days);
      }
    }
  }
}
