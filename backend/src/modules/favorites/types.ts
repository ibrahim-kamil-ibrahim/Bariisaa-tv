import { z } from 'zod';
import { toggleFavoriteSchema } from './favorite.validation';

export type ToggleFavoriteDto = z.infer<typeof toggleFavoriteSchema>;
