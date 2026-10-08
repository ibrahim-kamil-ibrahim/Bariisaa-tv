import { z } from 'zod';

const storyStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const storyBaseSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  // MediaFile id of an uploaded video (type='video'). Null/'' clears the link.
  videoId: z.string().nullish(),
  category: z.string().max(100).optional(),
  status: storyStatus.optional(),
  isFeatured: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  tags: z.string().optional(),
  accessTier: z.enum(['FREE', 'PAID']).optional(),
  requiredPlanId: z.string().nullish(),
});

const paidContentRefine = (data: any) => {
  if (data.accessTier === 'PAID' && !data.requiredPlanId) {
    return false;
  }
  return true;
};

export const createStorySchema = storyBaseSchema.refine(paidContentRefine, {
  message: 'Required plan is required for paid content',
  path: ['requiredPlanId'],
});

export const updateStorySchema = storyBaseSchema.partial().refine(paidContentRefine, {
  message: 'Required plan is required for paid content',
  path: ['requiredPlanId'],
});
