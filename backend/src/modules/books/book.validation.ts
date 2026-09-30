import { z } from 'zod';

const bookBaseSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  language: z.string().default('en'),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishDate: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.coerce.date().optional()),
  pageCount: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.coerce.number().int().positive().optional()),
  isFeatured: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isPremium: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  isFree: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  accessTier: z.enum(['FREE', 'PAID']).optional(),
  requiredPlanId: z.string().nullish(),
  categoryIds: z.array(z.string()).optional(),
  authorIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const paidContentRefine = (data: any) => {
  // If accessTier is PAID, requiredPlanId must be provided
  if (data.accessTier === 'PAID' && !data.requiredPlanId) {
    return false;
  }
  return true;
};

export const createBookSchema = bookBaseSchema.refine(paidContentRefine, {
  message: 'Required plan is required for paid content',
  path: ['requiredPlanId'],
});

export const updateBookSchema = bookBaseSchema.partial().refine(paidContentRefine, {
  message: 'Required plan is required for paid content',
  path: ['requiredPlanId'],
});

export const bookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  authorId: z.string().optional(),
  language: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPremium: z.coerce.boolean().optional(),
  isFree: z.coerce.boolean().optional(),
  accessTier: z.enum(['FREE', 'PAID']).optional(),
  sort: z.enum(['newest', 'popularity', 'rating', 'alphabetical']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});
