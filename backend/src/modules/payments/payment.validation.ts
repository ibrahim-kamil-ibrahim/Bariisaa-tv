import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  planId: z.string().min(1),
});
