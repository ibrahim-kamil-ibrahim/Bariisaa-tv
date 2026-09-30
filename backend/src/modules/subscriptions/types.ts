import { z } from 'zod';
import { subscribeSchema, adminPlanSchema } from './subscription.validation';

export type SubscribeDto = z.infer<typeof subscribeSchema>;
export type AdminPlanDto = z.infer<typeof adminPlanSchema>;
