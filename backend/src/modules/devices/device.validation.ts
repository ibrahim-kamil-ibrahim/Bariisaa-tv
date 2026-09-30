import { z } from 'zod';

export const registerDeviceSchema = z.object({
  deviceUid: z.string().min(1),
  deviceName: z.string().min(1),
  platform: z.enum(['ANDROID', 'IOS', 'WEB']),
  osVersion: z.string().optional(),
  fcmToken: z.string().optional(),
});
