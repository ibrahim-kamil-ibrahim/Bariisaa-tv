import { z } from 'zod';
import { createBookmarkSchema } from './bookmark.validation';

export type CreateBookmarkDto = z.infer<typeof createBookmarkSchema>;
