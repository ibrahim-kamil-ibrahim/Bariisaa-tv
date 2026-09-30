import { z } from 'zod';

export const createNoteSchema = z.object({
  bookId: z.string().min(1),
  content: z.string().min(1),
  position: z.string().min(1),
  pageNumber: z.number().int().positive().optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  pageNumber: z.number().int().positive().optional(),
});
