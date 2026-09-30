import { useEffect, useRef, useState, useCallback } from 'react';
import { googleLogin, AuthSession } from './api';

interface GoogleId {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (parent: HTMLElement, config: {
    type?: string;
    theme?: string;
    size?: string;
    text?: string;
    shape?: string;
    logo_alignment?: string;
    width?: number;
    callback?: (response: { credential: string }) => void;
  }) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function getGoogleId(): GoogleId | undefined {
  return (window as unknown as { google?: { accounts: { id: GoogleId } } }).google?.accounts.id;
}

export function useOAuthGoogle(onSuccess: (session: AuthSession) => void) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured');
      return;
    }
    if (getGoogleId()) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError('Failed to load Google Sign-In');
    document.head.appendChild(script);
  }, []);

  const handleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await googleLogin({ idToken: credential });
      onSuccessRef.current(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const renderButton = useCallback((container: HTMLElement) => {
    const googleId = getGoogleId();
    if (!googleId || !GOOGLE_CLIENT_ID || !container) return;

    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        handleCredential(response.credential);
      },
    });

    googleId.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: container.offsetWidth || 400,
    });
  }, [handleCredential]);

  return { ready, error, loading, renderButton };
}
