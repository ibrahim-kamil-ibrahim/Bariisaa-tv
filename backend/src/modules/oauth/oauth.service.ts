import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';
import {
  generateAuthorizationCode,
  verifyCodeChallenge,
} from './pkce';

const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  state: string;
}

interface AuthorizeResult {
  authorizationUrl: string;
}

export async function createAuthorizationUrl(
  params: AuthorizeParams,
  userId: string
): Promise<AuthorizeResult> {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.clientId },
  });

  if (!client || !client.isActive) {
    throw new AppError('Invalid client_id', 400);
  }

  if (!client.redirectUris.includes(params.redirectUri)) {
    throw new AppError('Invalid redirect_uri', 400);
  }

  const code = generateAuthorizationCode();
  const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRY_MS);

  await prisma.authorizationCode.create({
    data: {
      code,
      clientId: client.id,
      userId,
      redirectUri: params.redirectUri,
      scope: params.scope,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt,
    },
  });

  const callbackUrl = new URL(params.redirectUri);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('state', params.state);

  return {
    authorizationUrl: callbackUrl.toString(),
  };
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  codeVerifier: string
) {
  const authCode = await prisma.authorizationCode.findUnique({
    where: { code },
    include: { client: true, user: true },
  });

  if (!authCode) {
    throw new AppError('Invalid authorization code', 400);
  }

  if (authCode.usedAt) {
    throw new AppError('Authorization code already used', 400);
  }

  if (authCode.expiresAt < new Date()) {
    throw new AppError('Authorization code expired', 400);
  }

  if (authCode.redirectUri !== redirectUri) {
    throw new AppError('redirect_uri mismatch', 400);
  }

  if (authCode.client.clientId !== clientId) {
    throw new AppError('client_id mismatch', 400);
  }

  if (!authCode.client.isActive) {
    throw new AppError('Client is disabled', 400);
  }

  if (authCode.user.status !== 'ACTIVE') {
    throw new AppError('Account is not active', 403);
  }

  const validChallenge = verifyCodeChallenge(
    codeVerifier,
    authCode.codeChallenge,
    authCode.codeChallengeMethod
  );

  if (!validChallenge) {
    throw new AppError('Invalid code_verifier', 400);
  }

  await prisma.authorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  });

  const accessToken = jwt.sign(
    { userId: authCode.userId, scope: authCode.scope, clientId, jti: uuidv4() },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS } as jwt.SignOptions
  );

  const refreshTokenValue = jwt.sign(
    { userId: authCode.userId, clientId, jti: uuidv4() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` } as jwt.SignOptions
  );

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.oAuthToken.create({
    data: {
      accessToken,
      refreshToken: refreshTokenValue,
      clientId: authCode.client.id,
      userId: authCode.userId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000),
    },
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
    refresh_token: refreshTokenValue,
    scope: authCode.scope,
  };
}

export async function refreshOAuthTokens(
  refreshTokenValue: string,
  clientId: string
) {
  try {
    jwt.verify(refreshTokenValue, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const storedToken = await prisma.oAuthToken.findUnique({
    where: { refreshToken: refreshTokenValue },
    include: { client: true, user: true },
  });

  if (!storedToken) {
    throw new AppError('Refresh token not found', 401);
  }

  if (storedToken.revokedAt) {
    throw new AppError('Refresh token revoked', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  if (storedToken.client.clientId !== clientId) {
    throw new AppError('client_id mismatch', 400);
  }

  if (storedToken.user.status !== 'ACTIVE') {
    throw new AppError('Account is not active', 403);
  }

  const newAccessToken = jwt.sign(
    { userId: storedToken.userId, scope: storedToken.scope, clientId, jti: uuidv4() },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS } as jwt.SignOptions
  );

  const newRefreshTokenValue = jwt.sign(
    { userId: storedToken.userId, clientId, jti: uuidv4() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` } as jwt.SignOptions
  );

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.$transaction([
    prisma.oAuthToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),
    prisma.oAuthToken.create({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenValue,
        clientId: storedToken.clientId,
        userId: storedToken.userId,
        scope: storedToken.scope,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000),
      },
    }),
  ]);

  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRY_SECONDS,
    refresh_token: newRefreshTokenValue,
    scope: storedToken.scope,
  };
}

export async function revokeOAuthToken(
  token: string,
  clientId: string,
  tokenTypeHint?: string
) {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    throw new AppError('Invalid client', 400);
  }

  let whereClause: Record<string, unknown> = { clientId: client.id };

  if (tokenTypeHint === 'refresh_token') {
    whereClause.refreshToken = token;
  } else if (tokenTypeHint === 'access_token') {
    whereClause.accessToken = token;
  } else {
    whereClause = {
      clientId: client.id,
      OR: [{ accessToken: token }, { refreshToken: token }],
    };
  }

  const result = await prisma.oAuthToken.updateMany({
    where: whereClause,
    data: { revokedAt: new Date() },
  });

  if (result.count === 0) {
    throw new AppError('Token not found', 400);
  }

  return { message: 'Token revoked successfully' };
}

export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      phoneVerified: true,
      preferredLanguage: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    sub: user.id,
    email: user.email,
    phone_number: user.phone,
    name: user.name,
    picture: user.avatarUrl,
    email_verified: user.emailVerified,
    phone_verified: user.phoneVerified,
    preferred_language: user.preferredLanguage,
    created_at: user.createdAt,
  };
}
