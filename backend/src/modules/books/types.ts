import { z } from 'zod';
import { createBookSchema, updateBookSchema, bookQuerySchema } from './book.validation';

export type CreateBookDto = z.infer<typeof createBookSchema>;
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
export type BookQueryDto = z.infer<typeof bookQuerySchema>;
