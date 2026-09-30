import { z } from 'zod';

export const createAuthorSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export const updateAuthorSchema = createAuthorSchema.partial();
