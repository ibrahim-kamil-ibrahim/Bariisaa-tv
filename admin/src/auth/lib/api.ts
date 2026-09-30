const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  if (err && typeof err === 'object' && 'message' in err) return new Error(String((err as { message: unknown }).message));
  console.error('[API] Unexpected throw value:', err);
  return new Error('Request failed');
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch (err) {
    console.error(`[API] GET ${path} network error:`, err);
    throw toError(err);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    console.error(`[API] GET ${path} failed:`, response.status, body);
    throw new Error(body.message || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[API] POST ${path} network error:`, err);
    throw toError(err);
  }

  if (!response.ok) {
    const body2 = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    console.error(`[API] POST ${path} failed:`, response.status, body2);
    throw new Error(body2.message || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}
