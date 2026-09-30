import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferredLanguage: z.string().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED']).optional(),
});
