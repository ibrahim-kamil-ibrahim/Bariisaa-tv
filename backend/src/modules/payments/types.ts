import { z } from 'zod';
import { validateCouponSchema } from './payment.validation';

export type ValidateCouponDto = z.infer<typeof validateCouponSchema>;
