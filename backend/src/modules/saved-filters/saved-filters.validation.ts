import { z } from 'zod';

export const createSavedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  module: z.string().min(1),
  filters: z.record(z.any()),
  isPublic: z.boolean().optional(),
});

export const updateSavedFilterSchema = createSavedFilterSchema.partial();
