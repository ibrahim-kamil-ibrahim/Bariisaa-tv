import { z } from 'zod';

export const createHighlightSchema = z.object({
  bookId: z.string().min(1),
  selectedText: z.string().min(1),
  color: z.string().min(1),
  position: z.string().min(1),
  pageNumber: z.number().int().positive().optional(),
});
