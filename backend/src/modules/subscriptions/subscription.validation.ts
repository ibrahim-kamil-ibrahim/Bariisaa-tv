import { z } from 'zod';

export const subscribeSchema = z.object({
  planId: z.string(),
  couponCode: z.string().optional(),
  gateway: z.enum(['TELEBIRR', 'STRIPE', 'CHAPA', 'MANUAL']),
  // Manual payment fields (bank transfer / mobile money)
  channel: z.enum(['BANK', 'MOBILE_MONEY']).optional(),
  accountName: z.string().max(120).optional(),
  reference: z.string().max(160).optional(),
});

export const adminPlanSchema = z.object({
  name: z.string().min(1),
  durationMonths: z.number().int().positive(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  features: z.any().optional(),
  isActive: z.boolean().optional(),
});
