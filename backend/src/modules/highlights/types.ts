import { z } from 'zod';
import { createHighlightSchema } from './highlight.validation';

export type CreateHighlightDto = z.infer<typeof createHighlightSchema>;
