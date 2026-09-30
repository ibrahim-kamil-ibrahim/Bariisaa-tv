import { z } from 'zod';
import { createNoteSchema, updateNoteSchema } from './note.validation';

export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
