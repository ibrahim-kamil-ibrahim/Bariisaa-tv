import { z } from 'zod';

export const sendNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum([
    'NEW_BOOK',
    'NEW_AUDIO',
    'NEW_EBOOK',
    'PROMOTION',
    'SUBSCRIPTION_REMINDER',
    'ANNOUNCEMENT',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
  ]),
  targetType: z.enum(['ALL', 'SUBSCRIBED', 'SPECIFIC_USERS']),
  targetIds: z.array(z.string()).optional(),
});
