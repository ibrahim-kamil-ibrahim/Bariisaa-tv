import { useState, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { apiPost } from '../lib/api';
import { z } from 'zod';
import { Lock, Check, AlertCircle, ShieldAlert } from 'lucide-react';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const result = schema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (!token) {
      setError('Invalid or expired reset link.');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="page-enter text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-3xl mb-8">
          <ShieldAlert className="w-10 h-10 text-red-500" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Invalid link</h2>
        <p className="text-slate-600 mb-8">This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password">
          <Button>Request new link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#402083]/10 rounded-3xl mb-8 border-2 border-[#402083]/20">
          <Lock className="w-9 h-9 text-[#402083]" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Set new password</h2>
        <p className="text-slate-600">Choose a strong password for your account</p>
      </div>

      {success ? (
        <div className="text-center space-y-6 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full">
            <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h3>
            <p className="text-slate-600">You can now sign in with your new password.</p>
          </div>
          <Link to="/login">
            <Button className="mt-4">Sign in</Button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="error-alert mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              helpText="Use a strong password with letters, numbers & symbols"
              icon={<Lock className="w-5 h-5" />}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              icon={<Lock className="w-5 h-5" />}
            />
            <Button type="submit" loading={loading}>
              Reset password
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
