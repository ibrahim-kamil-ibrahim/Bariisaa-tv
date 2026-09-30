import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as oauthService from './oauth.service';
import { successResponse } from '../../utils/response';

export async function authorize(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scope,
      state,
    } = req.query as Record<string, string>;

    const result = await oauthService.createAuthorizationUrl(
      {
        clientId: client_id,
        redirectUri: redirect_uri,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method || 'S256',
        scope: scope || 'openid profile email',
        state,
      },
      req.userId!
    );

    successResponse(res, {
      authorization_url: result.authorizationUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function token(req: Request, res: Response, next: NextFunction) {
  try {
    const { grant_type } = req.body;

    if (grant_type === 'authorization_code') {
      const { code, redirect_uri, client_id, code_verifier } = req.body;
      const result = await oauthService.exchangeCodeForTokens(
        code,
        redirect_uri,
        client_id,
        code_verifier
      );
      successResponse(res, result, 'Token issued');
    } else if (grant_type === 'refresh_token') {
      const { refresh_token, client_id } = req.body;
      const result = await oauthService.refreshOAuthTokens(
        refresh_token,
        client_id
      );
      successResponse(res, result, 'Token refreshed');
    } else {
      successResponse(res, null, 'Unsupported grant_type', 400);
    }
  } catch (error) {
    next(error);
  }
}

export async function revoke(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, token_type_hint, client_id } = req.body;
    const result = await oauthService.revokeOAuthToken(
      token,
      client_id,
      token_type_hint
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function userinfo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await oauthService.getUserInfo(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function discovery(_req: Request, res: Response) {
  const baseUrl = `${_req.protocol}://${_req.get('host')}`;

  successResponse(res, {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/v1/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/v1/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/v1/oauth/userinfo`,
    revocation_endpoint: `${baseUrl}/api/v1/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['openid', 'profile', 'email'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  });
}
