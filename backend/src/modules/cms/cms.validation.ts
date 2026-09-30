import { z } from 'zod';

export const createCmsPageSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  content: z.string(),
  type: z.string().default('page'),
  status: z.string().default('draft'),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  imageUrl: z.string().url().optional(),
  order: z.number().int().optional(),
});

export const updateCmsPageSchema = createCmsPageSchema.partial();
