import { z } from 'zod';
import { recommendationQuerySchema } from './recommendation.validation';

export type RecommendationQueryDto = z.infer<typeof recommendationQuerySchema>;
