import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { OAuthInput } from '../components/OAuthInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { loginWithEmail, sendLoginOtp } from '../lib/api';
import { ensureFlowParams, flowQuery, completeOAuth, mergeFlowParams } from '../lib/flow';
import { Mail, Lock, Phone, AlertCircle } from 'lucide-react';

type LoginMode = 'email' | 'phone';

export function OAuthLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flow = ensureFlowParams(searchParams);

  const [mode, setMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onGoogleSuccess = (session: { accessToken: string }) => {
    completeOAuth(session.accessToken).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to complete sign in');
      setLoading(false);
    });
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    try {
      const session = await loginWithEmail({ email, password });
      await completeOAuth(session.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('Enter your phone number');
      return;
    }
    setLoading(true);
    try {
      await sendLoginOtp({ phone });
      const q = new URLSearchParams();
      q.set('mode', 'login');
      q.set('phone', phone);
      mergeFlowParams(q, flow);
      navigate(`/oauth/otp?${q.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signupHref = `/oauth/signup${flowQuery(flow) ? `?${flowQuery(flow)}` : ''}`;
  const forgotHref = `/oauth/forgot-password${flowQuery(flow) ? `?${flowQuery(flow)}` : ''}`;

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="Welcome back! Sign in to continue">
      <div className="oauth-tabs">
        <button
          type="button"
          className={`oauth-tab ${mode === 'email' ? 'oauth-tab-active' : ''}`}
          onClick={() => setMode('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`oauth-tab ${mode === 'phone' ? 'oauth-tab-active' : ''}`}
          onClick={() => setMode('phone')}
        >
          Phone
        </button>
      </div>

      {(error) && (
        <div className="oauth-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {mode === 'email' ? (
        <form onSubmit={handleEmailLogin}>
          <OAuthInput
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            icon={<Mail size={20} />}
          />
          <OAuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            icon={<Lock size={20} />}
          />

          <div className="oauth-row">
            <Link className="oauth-link" to={forgotHref}>
              Forgot password?
            </Link>
          </div>

          <OAuthButton type="submit" loading={loading}>
            Sign in
          </OAuthButton>
        </form>
      ) : (
        <form onSubmit={handlePhoneLogin}>
          <OAuthInput
            label="Phone number"
            type="tel"
            placeholder="+251 9XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
            icon={<Phone size={20} />}
            helpText="We'll send a 6-digit code to this number"
          />
          <OAuthButton type="submit" loading={loading}>
            Continue with phone
          </OAuthButton>
        </form>
      )}

      <div className="oauth-divider">or</div>

      <GoogleSignInButton onSuccess={onGoogleSuccess} />

      <p className="oauth-help" style={{ justifyContent: 'center', marginTop: 20 }}>
        Don't have an account?{' '}
        <Link className="oauth-link" to={signupHref}>
          Create account
        </Link>
      </p>
    </OAuthAuthLayout>
  );
}
