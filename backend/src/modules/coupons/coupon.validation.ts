import { z } from 'zod';

export const couponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  applicablePlans: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().or(z.literal('')).optional(),
});
