import { useEffect, useRef } from 'react';
import { useOAuthGoogle } from '../lib/google';
import { AuthSession } from '../lib/api';
import { AlertCircle } from 'lucide-react';

export function GoogleSignInButton({ onSuccess }: { onSuccess: (session: AuthSession) => void }) {
  const { ready, error, loading, renderButton } = useOAuthGoogle(onSuccess);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && containerRef.current) {
      renderButton(containerRef.current);
    }
  }, [ready, renderButton]);

  if (error) {
    return (
      <div className="oauth-error">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="oauth-google-wrap">
      <div ref={containerRef} className="oauth-google-slot" />
      {loading && (
        <p className="oauth-help" style={{ justifyContent: 'center' }}>
          Completing Google sign-in...
        </p>
      )}
    </div>
  );
}
