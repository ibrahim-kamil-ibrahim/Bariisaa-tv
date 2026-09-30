import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  emoji: z.string().max(10).optional(),
  category: z.string().max(100).optional(),
  points: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const updateHabitSchema = createHabitSchema.partial();
