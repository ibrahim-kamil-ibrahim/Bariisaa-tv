import { useState, useCallback, useEffect, useRef } from 'react';
import { apiPost } from './api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
            getNotDisplayedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          renderButton: (parent: HTMLElement, config: {
            type: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: number;
            callback: (response: { credential: string }) => void;
          }) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function useGoogleAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<((idToken: string) => void) | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError('Failed to load Google Sign-In');
    document.head.appendChild(script);
  }, []);

  const handleGoogleLogin = useCallback(async (idToken: string) => {
    const data = await apiPost<{ user: unknown; accessToken: string; refreshToken: string }>(
      '/auth/google',
      { idToken }
    );

    sessionStorage.setItem('auth_user', JSON.stringify(data.user));
    sessionStorage.setItem('auth_access_token', data.accessToken);
    sessionStorage.setItem('auth_refresh_token', data.refreshToken);

    return data;
  }, []);

  const renderButton = useCallback((container: HTMLElement) => {
    if (!window.google || !GOOGLE_CLIENT_ID || !container) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          await handleGoogleLogin(response.credential);
          callbackRef.current?.(response.credential);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Google login failed');
        }
      },
      auto_select: false,
    });

    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: container.offsetWidth || 350,
      callback: async (response) => {
        try {
          await handleGoogleLogin(response.credential);
          callbackRef.current?.(response.credential);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Google login failed');
        }
      },
    });
  }, [handleGoogleLogin]);

  const setCallback = useCallback((cb: (idToken: string) => void) => {
    callbackRef.current = cb;
  }, []);

  return { ready, error, renderButton, setCallback, GOOGLE_CLIENT_ID, buttonContainerRef };
}
