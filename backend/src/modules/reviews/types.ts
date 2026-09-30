import { z } from 'zod';
import { createReviewSchema, updateReviewSchema } from './review.validation';

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
