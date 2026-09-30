import { useState, FormEvent, useRef, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { apiPost } from '../lib/api';
import { Smartphone, Check, AlertCircle } from 'lucide-react';

export function OtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await apiPost<{ verified: boolean }>('/auth/verify-otp', { phone, code });
      if (data.verified) {
        setSuccess(true);
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectUri = params.get('redirect_uri');
          const clientId = params.get('client_id');
          const state = params.get('state');
          const codeChallenge = params.get('code_challenge');
          const scope = params.get('scope') || 'openid profile email';

          if (redirectUri && clientId && state && codeChallenge) {
            navigate(`/login?redirect_uri=${redirectUri}&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&scope=${scope}`);
          } else {
            navigate('/login');
          }
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await apiPost('/auth/resend-otp', { phone });
      setError('');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="page-enter text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#402083] to-[#3D2081] rounded-3xl mb-8 shadow-xl shadow-[#402083]/40">
        <Smartphone className="w-10 h-10 text-white" strokeWidth={2} />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-3">Verify your phone</h2>
      <p className="text-slate-600 mb-1">We sent a 6-digit code to</p>
      <p className="font-bold text-slate-900 text-lg">{phone || 'your phone'}</p>

      {error && (
        <div className="error-alert mt-6 text-left">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="mt-10 space-y-5 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full">
            <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 mb-2">Phone verified!</p>
            <p className="text-slate-500">Redirecting to sign in...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-box"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button type="submit" loading={loading}>
            Verify code
          </Button>

          <div className="text-sm">
            <p className="text-slate-600 mb-3">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-[#402083] hover:text-[#3D2081] transition-colors hover:underline decoration-2 underline-offset-2 disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
