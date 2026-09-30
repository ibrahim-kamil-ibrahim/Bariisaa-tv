import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { Coupon, DiscountType } from '@prisma/client';

export interface CouponInput {
  code: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountPercent?: number;
  discountAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  applicablePlans?: string[];
  isActive?: boolean;
  expiresAt?: string | Date | null;
}

function toCouponResponse(coupon: Coupon) {
  const isPercent = coupon.discountType === 'PERCENTAGE';
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountPercent: isPercent ? coupon.discountValue : 0,
    discountAmount: isPercent ? 0 : coupon.discountValue,
    maxUses: coupon.maxUses,
    currentUses: coupon.usedCount,
    perUserLimit: coupon.perUserLimit,
    applicablePlans: coupon.applicablePlans,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
  };
}

function normalizeInput(data: CouponInput) {
  let discountType: DiscountType = 'PERCENTAGE';
  let discountValue = 0;

  if (data.discountType) {
    discountType = data.discountType;
    if (discountType === 'PERCENTAGE') {
      discountValue = data.discountValue ?? data.discountPercent ?? 0;
    } else {
      discountValue = data.discountValue ?? data.discountAmount ?? 0;
    }
  } else if (data.discountAmount !== undefined && data.discountAmount > 0) {
    discountType = 'FIXED';
    discountValue = data.discountAmount;
  } else if (data.discountPercent !== undefined) {
    discountType = 'PERCENTAGE';
    discountValue = data.discountPercent;
  }

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (expiresAt && isNaN(expiresAt.getTime())) {
    throw new AppError('Invalid expiresAt date', 400);
  }

  return {
    code: data.code.toUpperCase(),
    discountType,
    discountValue,
    maxUses: data.maxUses,
    perUserLimit: data.perUserLimit ?? 1,
    applicablePlans: data.applicablePlans,
    isActive: data.isActive ?? true,
    expiresAt,
  };
}

export async function listCoupons(
  page: number,
  limit: number,
  search?: string,
  isActive?: boolean
) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.code = { contains: search, mode: 'insensitive' };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coupon.count({ where }),
  ]);

  return {
    coupons: coupons.map(toCouponResponse),
    total,
  };
}

export async function getCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  return toCouponResponse(coupon);
}

export async function createCoupon(data: CouponInput) {
  const normalized = normalizeInput(data);

  const existing = await prisma.coupon.findUnique({
    where: { code: normalized.code },
  });

  if (existing) {
    throw new AppError('Coupon code already exists', 409);
  }

  const coupon = await prisma.coupon.create({ data: normalized });
  return toCouponResponse(coupon);
}

export async function updateCoupon(id: string, data: CouponInput) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  const normalized = normalizeInput(data);

  if (normalized.code && normalized.code !== coupon.code) {
    const existing = await prisma.coupon.findUnique({
      where: { code: normalized.code },
    });
    if (existing) {
      throw new AppError('Coupon code already exists', 409);
    }
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: normalized,
  });

  return toCouponResponse(updated);
}

export async function deleteCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  await prisma.coupon.delete({ where: { id } });
  return { message: 'Coupon deleted successfully' };
}
