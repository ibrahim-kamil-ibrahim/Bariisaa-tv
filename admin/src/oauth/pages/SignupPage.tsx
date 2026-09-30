import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { OAuthInput } from '../components/OAuthInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { signupEmail, signupPhone } from '../lib/api';
import { ensureFlowParams, flowQuery, setSignupToken, mergeFlowParams, completeOAuth } from '../lib/flow';
import { Mail, Lock, Phone, User, AlertCircle, CheckCircle } from 'lucide-react';

type SignupMode = 'email' | 'phone';

function passwordStrength(password: string): { label: string; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { label: labels[score], score };
}

export function OAuthSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flow = ensureFlowParams(searchParams);

  const [mode, setMode] = useState<SignupMode>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const strength = passwordStrength(password);

  const onGoogleSuccess = (session: { accessToken: string }) => {
    completeOAuth(session.accessToken).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to complete sign in');
      setLoading(false);
    });
  };

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) return 'Name must be at least 2 characters';
    if (mode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    if (mode === 'phone' && !/^\+?[0-9\s\-()]+$/.test(phone)) return 'Enter a valid phone number';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'email') {
        await signupEmail({ name: name.trim(), email, password });
        setCreated(email);
      } else {
        const session = await signupPhone({ name: name.trim(), phone, password });
        setSignupToken(session.accessToken);
        const q = new URLSearchParams();
        q.set('mode', 'signup');
        q.set('phone', phone);
        mergeFlowParams(q, flow);
        navigate(`/oauth/otp?${q.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = `/oauth/login${flowQuery(flow) ? `?${flowQuery(flow)}` : ''}`;

  if (created) {
    return (
      <OAuthAuthLayout title="Bariisaa Tv" subtitle="Almost there!">
        <div className="oauth-success">
          <div className="oauth-success-icon">
            <CheckCircle size={40} />
          </div>
          <h2 className="oauth-title" style={{ fontSize: 28 }}>Check your email</h2>
          <p className="oauth-sub" style={{ fontSize: 16 }}>
            We sent a verification link to <strong>{created}</strong>. Please verify your email, then sign in.
          </p>
          <OAuthButton type="button" onClick={() => navigate(loginHref)} style={{ marginTop: 20 }}>
            Go to sign in
          </OAuthButton>
        </div>
      </OAuthAuthLayout>
    );
  }

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="Create an account for your kid">
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

      {error && (
        <div className="oauth-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <OAuthInput
          label="Kid's name"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          icon={<User size={20} />}
        />

        {mode === 'email' ? (
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
        ) : (
          <OAuthInput
            label="Phone number"
            type="tel"
            placeholder="+251 9XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
            icon={<Phone size={20} />}
            helpText="We'll send a 6-digit code to verify this number"
          />
        )}

        <OAuthInput
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          icon={<Lock size={20} />}
          helpText="Use letters, numbers & symbols for a strong password"
        />

        {password && (
          <div className="oauth-help" style={{ marginTop: -8, flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: i <= strength.score ? (strength.score < 3 ? 'var(--playful-red)' : '#1f9d55') : 'var(--line)',
                  }}
                />
              ))}
            </div>
            <span>
              Password strength: <strong>{strength.label}</strong>
            </span>
          </div>
        )}

        <OAuthInput
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          icon={<Lock size={20} />}
        />

        <OAuthButton type="submit" loading={loading}>
          Create account
        </OAuthButton>
      </form>

      <div className="oauth-divider">or</div>

      <GoogleSignInButton onSuccess={onGoogleSuccess} />

      <p className="oauth-help" style={{ justifyContent: 'center', marginTop: 20 }}>
        Already have an account?{' '}
        <Link className="oauth-link" to={loginHref}>
          Sign in
        </Link>
      </p>
    </OAuthAuthLayout>
  );
}
