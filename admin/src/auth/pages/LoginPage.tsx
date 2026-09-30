import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { apiPost, apiGet } from '../lib/api';
import { useAuthStore } from '../../store/authStore';
import { z } from 'zod';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

interface LoginResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  console.error('[Login] Unexpected error object:', err);
  return 'Login failed. Please try again.';
}

export function AuthLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOAuthRedirect = async (accessToken: string) => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    const clientId = params.get('client_id');
    const state = params.get('state');
    const codeChallenge = params.get('code_challenge');
    const codeChallengeMethod = params.get('code_challenge_method') || 'S256';
    const scope = params.get('scope') || 'openid profile email';

    if (redirectUri && clientId && state && codeChallenge) {
      const authResult = await apiGet<{ authorization_url: string }>(
        `/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}&scope=${scope}&state=${state}`,
        accessToken
      );
      window.location.href = authResult.authorization_url;
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>('/auth/login', { email, password });

      useAuthStore.getState().login(data.user, data.accessToken);
      localStorage.setItem('naik_admin_refresh', data.refreshToken);

      await handleOAuthRedirect(data.accessToken);
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
        <p className="text-slate-600">Sign in to continue to your library</p>
      </div>

      {error && (
        <div className="error-alert mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          type="text"
          placeholder="naik"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          icon={<Mail className="w-5 h-5" />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          icon={<Lock className="w-5 h-5" />}
        />

        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
