import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export const updateSettingsSchema = z.object({
  settings: z.record(z.string()),
});

export type UpdateSettingDto = z.infer<typeof updateSettingSchema>;
