import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { OAuthInput } from '../components/OAuthInput';
import { forgotPassword } from '../lib/api';
import { ensureFlowParams, flowQuery } from '../lib/flow';
import { Mail, Phone, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

type ContactMode = 'email' | 'phone';

export function OAuthForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const flow = ensureFlowParams(searchParams);

  const [mode, setMode] = useState<ContactMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Enter a valid email address');
        return;
      }
    } else if (!/^\+?[0-9\s\-()]+$/.test(phone)) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(mode === 'email' ? { email } : { phone });
      setSentTo(mode === 'email' ? email : phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = `/oauth/login${flowQuery(flow) ? `?${flowQuery(flow)}` : ''}`;

  if (sentTo) {
    return (
      <OAuthAuthLayout title="Bariisaa Tv" subtitle="Check your inbox">
        <div className="oauth-success">
          <div className="oauth-success-icon">
            <CheckCircle size={40} />
          </div>
          <h2 className="oauth-title" style={{ fontSize: 28 }}>Reset instructions sent</h2>
          <p className="oauth-sub" style={{ fontSize: 16 }}>
            We sent password reset instructions to <strong>{sentTo}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20, width: '100%' }}>
            <OAuthButton type="button" onClick={() => { setSentTo(null); setError(''); }}>
              Try another contact
            </OAuthButton>
            <Link className="oauth-link" to={loginHref} style={{ textAlign: 'center' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </OAuthAuthLayout>
    );
  }

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="No worries, we'll help you reset it">
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
            helpText="We'll email you a reset link"
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
            helpText="We'll send a reset code via SMS"
          />
        )}

        <OAuthButton type="submit" loading={loading}>
          Send reset instructions
        </OAuthButton>
      </form>

      <p className="oauth-help" style={{ justifyContent: 'center', marginTop: 18 }}>
        <Link className="oauth-link" to={loginHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </p>
    </OAuthAuthLayout>
  );
}
