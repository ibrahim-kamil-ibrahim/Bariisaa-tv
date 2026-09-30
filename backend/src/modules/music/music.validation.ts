import { z } from 'zod';

const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const trackBaseSchema = z.object({
  title: z.string().min(1).max(300),
  artist: z.string().optional(),
  artistId: z.string().optional(),
  album: z.string().optional(),
  coverUrl: z.string().optional(),
  audioUrl: z.string().min(1),
  pdfUrl: z.string().optional(),
  genre: z.string().max(100).optional(),
  price: z.coerce.number().nonnegative().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().optional(),
  status: statusEnum.optional(),
  isFeatured: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  trackOrder: z.coerce.number().int().optional(),
  accessTier: z.enum(['FREE', 'PAID']).optional(),
  requiredPlanId: z.string().nullish(),
});

const paidContentRefine = (data: any) => {
  if (data.accessTier === 'PAID' && !data.requiredPlanId) {
    return false;
  }
  return true;
};

export const createTrackSchema = trackBaseSchema.refine(paidContentRefine, {
  message: 'Required plan is required for paid content',
  path: ['requiredPlanId'],
});

export const updateTrackSchema = trackBaseSchema.partial();

export const trackQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  genre: z.string().optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
  accessTier: z.enum(['FREE', 'PAID']).optional(),
});
