import { z } from 'zod';
import { createAuthorSchema, updateAuthorSchema } from './author.validation';

export type CreateAuthorDto = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorDto = z.infer<typeof updateAuthorSchema>;
