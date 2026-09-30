import { z } from 'zod';
import { sendNotificationSchema } from './notification.validation';

export type SendNotificationDto = z.infer<typeof sendNotificationSchema>;
