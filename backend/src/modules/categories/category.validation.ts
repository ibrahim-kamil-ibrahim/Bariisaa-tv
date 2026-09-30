import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  parentId: z.string().optional(),
  imageUrl: z.string().optional(),
  iconEmoji: z.string().optional(),
  route: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
