import { z } from 'zod';

export const createHealthTipSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  emoji: z.string().max(10).optional(),
  category: z.string().max(100).optional(),
  order: z.coerce.number().int().optional(),
});

export const updateHealthTipSchema = createHealthTipSchema.partial();

export const createDoctorProfileSchema = z.object({
  name: z.string().min(1).max(200),
  specialty: z.string().min(1).max(200),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  available: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  order: z.coerce.number().int().optional(),
});

export const updateDoctorProfileSchema = createDoctorProfileSchema.partial();
