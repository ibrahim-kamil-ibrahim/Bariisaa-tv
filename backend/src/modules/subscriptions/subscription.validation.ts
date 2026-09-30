import { z } from 'zod';

export const subscribeSchema = z.object({
  planId: z.string(),
  couponCode: z.string().optional(),
  gateway: z.enum(['TELEBIRR', 'STRIPE', 'CHAPA']),
});

export const adminPlanSchema = z.object({
  name: z.string().min(1),
  durationMonths: z.number().int().positive(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  features: z.any().optional(),
  isActive: z.boolean().optional(),
});
