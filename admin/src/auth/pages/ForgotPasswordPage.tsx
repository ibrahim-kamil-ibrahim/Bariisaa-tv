import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { apiPost } from '../lib/api';
import { z } from 'zod';
import { Mail, Key, ArrowLeft, Check, AlertCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const result = schema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#402083]/10 rounded-3xl mb-8 border-2 border-[#402083]/20">
          <Key className="w-9 h-9 text-[#402083]" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Forgot password?</h2>
        <p className="text-slate-600">No worries, we'll send you reset instructions</p>
      </div>

      {sent ? (
        <div className="text-center space-y-6 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full">
            <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h3>
            <p className="text-slate-600 mb-1">We sent a password reset link to</p>
            <p className="font-bold text-slate-900 text-lg">{email}</p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="mt-6 font-semibold text-[#402083] hover:text-[#3D2081] transition-colors hover:underline decoration-2 underline-offset-2"
          >
            Try another email
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="error-alert mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              icon={<Mail className="w-5 h-5" />}
            />
            <Button type="submit" loading={loading}>
              Send reset link
            </Button>
          </form>
        </>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 font-semibold text-[#402083] hover:text-[#3D2081] transition-colors hover:underline decoration-2 underline-offset-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
