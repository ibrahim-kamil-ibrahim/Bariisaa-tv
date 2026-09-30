import { z } from 'zod';
import { updateProfileSchema, adminUpdateUserSchema } from './user.validation';

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
