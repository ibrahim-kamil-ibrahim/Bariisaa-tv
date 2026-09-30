import { z } from 'zod';

export const toggleFavoriteSchema = z.object({
  bookId: z.string().min(1),
});
