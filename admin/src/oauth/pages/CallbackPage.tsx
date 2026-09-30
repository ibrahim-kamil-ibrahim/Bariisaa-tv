import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OAuthAuthLayout } from '../components/OAuthLayout';
import { OAuthButton } from '../components/OAuthButton';
import { clearFlow } from '../lib/flow';

const DEEP_LINK = 'com.bariisaa.app://callback';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      window.location.href = `${DEEP_LINK}?error=${encodeURIComponent(error)}`;
      return;
    }
    if (code && state) {
      window.location.href = `${DEEP_LINK}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    }
  }, [code, state, error]);

  const openApp = () => {
    if (error) {
      window.location.href = `${DEEP_LINK}?error=${encodeURIComponent(error)}`;
      return;
    }
    if (code && state) {
      window.location.href = `${DEEP_LINK}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    }
  };

  useEffect(() => {
    clearFlow();
  }, []);

  return (
    <OAuthAuthLayout title="Bariisaa Tv" subtitle="Almost done!">
      <div className="oauth-success">
        <div className="oauth-logo">
          <svg className="oauth-spinner" width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="oauth-title" style={{ fontSize: 28 }}>Redirecting you back...</h2>
        <p className="oauth-sub" style={{ fontSize: 16 }}>
          {error ? 'Something went wrong.' : 'You can close this tab if it doesn\'t redirect automatically.'}
        </p>
        <OAuthButton type="button" onClick={openApp} style={{ marginTop: 20 }}>
          Open Bariisaa Tv app
        </OAuthButton>
      </div>
    </OAuthAuthLayout>
  );
}
