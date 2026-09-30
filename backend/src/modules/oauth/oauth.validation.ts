import { z } from 'zod';

export const authorizeSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.enum(['S256', 'plain']).default('S256'),
  scope: z.string().default('openid profile email'),
  state: z.string().min(1),
});

export const tokenSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  code_verifier: z.string().min(43).max(128),
});

export const refreshTokenOAuthSchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string().min(1),
  client_id: z.string().min(1),
});

export const revokeSchema = z.object({
  token: z.string().min(1),
  token_type_hint: z.enum(['access_token', 'refresh_token']).optional(),
  client_id: z.string().min(1),
});

export const decisionSchema = z.object({
  action: z.enum(['allow', 'deny']),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().min(1),
  scope: z.string().optional(),
});
