import { z } from 'zod';
import { updateReadingProgressSchema, updateListeningProgressSchema } from './history.validation';

export type UpdateReadingProgressDto = z.infer<typeof updateReadingProgressSchema>;
export type UpdateListeningProgressDto = z.infer<typeof updateListeningProgressSchema>;
