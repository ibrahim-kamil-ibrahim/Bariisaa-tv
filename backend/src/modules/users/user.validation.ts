import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferredLanguage: z.string().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED']).optional(),
});

const userStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED']);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: userStatusEnum.optional(),
});

export const updateUserStatusSchema = z.object({
  status: userStatusEnum,
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: userStatusEnum,
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128).optional(),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().min(1)).max(50),
});
