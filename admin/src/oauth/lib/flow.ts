import { apiGet } from './api';

export interface OAuthFlowParams {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  state: string;
}

const FLOW_KEY = 'bariisaa_oauth_flow';
const SIGNUP_TOKEN_KEY = 'bariisaa_oauth_signup_token';

export function parseFlowParams(search: URLSearchParams): Partial<OAuthFlowParams> {
  const client_id = search.get('client_id') || '';
  const redirect_uri = search.get('redirect_uri') || '';
  const code_challenge = search.get('code_challenge') || '';
  const state = search.get('state') || '';
  const scope = search.get('scope') || 'openid profile email';
  const code_challenge_method = search.get('code_challenge_method') || 'S256';

  if (!client_id || !redirect_uri || !code_challenge || !state) {
    return {};
  }
  return { client_id, redirect_uri, code_challenge, code_challenge_method, scope, state };
}

export function saveFlowParams(params: OAuthFlowParams): void {
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(params));
}

export function loadFlowParams(): OAuthFlowParams | null {
  const raw = sessionStorage.getItem(FLOW_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OAuthFlowParams;
  } catch {
    return null;
  }
}

export function ensureFlowParams(search: URLSearchParams): OAuthFlowParams | null {
  const fromUrl = parseFlowParams(search);
  if (Object.keys(fromUrl).length > 0) {
    const full = fromUrl as OAuthFlowParams;
    saveFlowParams(full);
    return full;
  }
  return loadFlowParams();
}

export function flowQuery(params: OAuthFlowParams | null): string {
  if (!params) return '';
  const q = new URLSearchParams({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
    scope: params.scope,
    state: params.state,
  });
  return q.toString();
}

export function mergeFlowParams(target: URLSearchParams, params: OAuthFlowParams | null): void {
  if (!params) return;
  const q = new URLSearchParams(flowQuery(params));
  for (const [key, value] of q.entries()) {
    target.set(key, value);
  }
}

export function clearFlow(): void {
  sessionStorage.removeItem(FLOW_KEY);
  sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
}

export function setSignupToken(token: string): void {
  sessionStorage.setItem(SIGNUP_TOKEN_KEY, token);
}

export function getSignupToken(): string | null {
  return sessionStorage.getItem(SIGNUP_TOKEN_KEY);
}

export async function completeOAuth(accessToken: string): Promise<void> {
  const flow = loadFlowParams();
  if (!flow) {
    window.location.href = '/oauth/callback?error=missing_pkce_params';
    return;
  }

  const result = await apiGet<{ authorization_url: string }>(
    `/oauth/authorize?client_id=${encodeURIComponent(flow.client_id)}&redirect_uri=${encodeURIComponent(
      flow.redirect_uri
    )}&code_challenge=${encodeURIComponent(flow.code_challenge)}&code_challenge_method=${encodeURIComponent(
      flow.code_challenge_method
    )}&scope=${encodeURIComponent(flow.scope)}&state=${encodeURIComponent(flow.state)}`,
    accessToken
  );

  clearFlow();
  window.location.href = result.authorization_url;
}
