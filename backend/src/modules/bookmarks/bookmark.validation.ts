import { z } from 'zod';

export const createBookmarkSchema = z.object({
  bookId: z.string().min(1),
  type: z.enum(['AUDIO', 'PDF']),
  position: z.string().min(1),
  label: z.string().optional(),
  timestampSeconds: z.number().int().min(0).optional(),
});
