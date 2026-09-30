import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { OAuthInput } from '../components/OAuthInput';
import { resetPassword } from '../lib/api';
import { loadFlowParams, flowQuery } from '../lib/flow';
import { Lock, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

function passwordStrength(password: string): { label: string; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { label: labels[score], score };
}

export function OAuthResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const flow = loadFlowParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const loginHref = `/oauth/login${flow ? `?${flowQuery(flow)}` : ''}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invalid or expired reset link.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <OAuthAuthLayout title="Bariisaa Tv" subtitle="Something went wrong">
        <div className="oauth-success">
          <div className="oauth-success-icon" style={{ background: '#fdecec', color: 'var(--playful-red)' }}>
            <ShieldAlert size={40} />
          </div>
          <h2 className="oauth-title" style={{ fontSize: 28 }}>Invalid link</h2>
          <p className="oauth-sub" style={{ fontSize: 16 }}>
            This password reset link is invalid or has expired.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20, width: '100%' }}>
            <Link className="oauth-link" to="/oauth/forgot-password" style={{ textAlign: 'center' }}>
              Request a new link
            </Link>
            <Link className="oauth-link" to={loginHref} style={{ textAlign: 'center' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </OAuthAuthLayout>
    );
  }

  if (success) {
    return (
      <OAuthAuthLayout title="Bariisaa Tv" subtitle="All set!">
        <div className="oauth-success">
          <div className="oauth-success-icon">
            <CheckCircle size={40} />
          </div>
          <h2 className="oauth-title" style={{ fontSize: 28 }}>Password updated!</h2>
          <p className="oauth-sub" style={{ fontSize: 16 }}>
            You can now sign in with your new password.
          </p>
          <Link to={loginHref} style={{ width: '100%', marginTop: 20, textDecoration: 'none' }}>
            <OAuthButton type="button">Go to sign in</OAuthButton>
          </Link>
        </div>
      </OAuthAuthLayout>
    );
  }

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="Choose a strong password">
      {error && (
        <div className="oauth-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <OAuthInput
          label="New password"
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
          label="Confirm new password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          icon={<Lock size={20} />}
        />

        <OAuthButton type="submit" loading={loading}>
          Reset password
        </OAuthButton>
      </form>
    </OAuthAuthLayout>
  );
}
