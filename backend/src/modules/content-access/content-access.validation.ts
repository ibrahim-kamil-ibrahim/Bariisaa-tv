import { z } from 'zod';

export const setContentAccessSchema = z.object({
  accessTier: z.enum(['FREE', 'PAID']),
  requiredPlanId: z.string().nullish(),
}).refine((data) => {
  // When accessTier is PAID, requiredPlanId must be provided
  if (data.accessTier === 'PAID' && !data.requiredPlanId) {
    return false;
  }
  return true;
}, {
  message: 'Required plan is required for PAID content',
  path: ['requiredPlanId'],
});
