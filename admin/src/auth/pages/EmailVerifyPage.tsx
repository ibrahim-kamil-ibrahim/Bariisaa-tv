import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { apiPost } from '../lib/api';
import { Loader2, Check, ShieldAlert } from 'lucide-react';

export function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }
    apiPost('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed.');
      });
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await apiPost('/auth/resend-verification', {});
    } catch {
      /* ignore */
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#402083]/5 to-slate-50 p-6">
      <div className="text-center max-w-md">
        {status === 'verifying' && (
          <div className="animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl mb-8 shadow-2xl shadow-brand-600/40">
              <Loader2 className="w-12 h-12 text-white animate-spin" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email...</h2>
            <p className="text-slate-600">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-scale-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 rounded-3xl mb-8">
              <Check className="w-12 h-12 text-emerald-600" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Email verified!</h2>
            <p className="text-slate-600 mb-8">Your email has been successfully verified.</p>
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-3xl mb-8">
              <ShieldAlert className="w-12 h-12 text-red-500" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Verification failed</h2>
            <p className="text-slate-600 mb-8">
              {error || 'This verification link is invalid or has expired.'}
            </p>
            <div className="space-y-3">
              <Button onClick={handleResend} disabled={resending}>
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
              <div>
                <Link to="/login">
                  <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Back to sign in
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
