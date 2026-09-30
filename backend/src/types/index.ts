import { z } from 'zod';
import { refreshTokenSchema } from '../modules/auth/auth.validation';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  name: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export interface AuthenticatedRequest {
  userId?: string;
  userRoles?: string[];
  userPermissions?: string[];
}
