import { useState, FormEvent, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { loginOtp, sendLoginOtp, verifyPhone, resendPhoneOtp } from '../lib/api';
import { ensureFlowParams, completeOAuth, getSignupToken } from '../lib/flow';
import { Smartphone, AlertCircle, CheckCircle } from 'lucide-react';

const RESEND_SECONDS = 60;

export function OAuthOtpPage() {
  const [searchParams] = useSearchParams();
  ensureFlowParams(searchParams);
  const mode = searchParams.get('mode') || 'login';
  const phone = searchParams.get('phone') || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(RESEND_SECONDS);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
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
      if (mode === 'login') {
        const session = await loginOtp({ phone, otp: code });
        await completeOAuth(session.accessToken);
      } else {
        const signupToken = getSignupToken();
        if (!signupToken) {
          throw new Error('Signup session expired. Please start again.');
        }
        await verifyPhone({ otp: code }, signupToken);
        setSuccess(true);
        await completeOAuth(signupToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      if (mode === 'login') {
        await sendLoginOtp({ phone });
      } else {
        const signupToken = getSignupToken();
        if (!signupToken) throw new Error('Signup session expired. Please start again.');
        await resendPhoneOtp(signupToken);
      }
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSecondsLeft(RESEND_SECONDS);
      setCanResend(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <OAuthAuthLayout title="Bariisaa Tv" subtitle="Phone verified!">
        <div className="oauth-success">
          <div className="oauth-success-icon">
            <CheckCircle size={40} />
          </div>
          <h2 className="oauth-title" style={{ fontSize: 28 }}>Phone verified!</h2>
          <p className="oauth-sub" style={{ fontSize: 16 }}>Redirecting you to sign in...</p>
        </div>
      </OAuthAuthLayout>
    );
  }

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="Verify your phone">
      <div className="oauth-success" style={{ marginBottom: 20 }}>
        <div className="oauth-logo" style={{ width: 64, height: 64, fontSize: 26, marginBottom: 8 }}>
          <Smartphone size={28} />
        </div>
        <p className="oauth-sub" style={{ fontSize: 16 }}>
          We sent a 6-digit code to
        </p>
        <p style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>{phone || 'your phone'}</p>
      </div>

      {error && (
        <div className="oauth-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="oauth-otp-grid">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              className="oauth-otp"
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <OAuthButton type="submit" loading={loading}>
          Verify code
        </OAuthButton>
      </form>

      <p className="oauth-help" style={{ justifyContent: 'center', marginTop: 18 }}>
        Didn't receive the code?{' '}
        {canResend ? (
          <button type="button" className="oauth-link" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        ) : (
          <span style={{ color: 'var(--muted)' }}>Resend in {secondsLeft}s</span>
        )}
      </p>
    </OAuthAuthLayout>
  );
}
