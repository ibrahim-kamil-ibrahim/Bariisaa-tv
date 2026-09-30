import { z } from 'zod';

export const updateReadingProgressSchema = z.object({
  bookId: z.string().min(1),
  lastPosition: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
});

export const updateListeningProgressSchema = z.object({
  bookId: z.string().min(1),
  lastTimestampSec: z.number().int().min(0),
  progressPercent: z.number().min(0).max(100).optional(),
});
