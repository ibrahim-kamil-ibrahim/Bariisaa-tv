import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      window.location.href = `com.bariisaa.app://callback?error=${encodeURIComponent(error)}`;
      return;
    }
    if (code && state) {
      window.location.href = `com.bariisaa.app://callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    }
  }, [code, state, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#402083]/5 to-slate-50">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl mb-8 shadow-2xl shadow-brand-600/40">
          <Loader2 className="w-12 h-12 text-white animate-spin" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Returning to Bariisaa Tv...</h2>
        <p className="text-slate-600">You may close this tab if it doesn't redirect.</p>
      </div>
    </div>
  );
}
