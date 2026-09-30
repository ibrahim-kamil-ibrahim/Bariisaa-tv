import { z } from 'zod';
import { registerDeviceSchema } from './device.validation';

export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;
