import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from './category.validation';

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
