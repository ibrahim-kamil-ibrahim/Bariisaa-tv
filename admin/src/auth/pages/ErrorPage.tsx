import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function ErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error') || 'Unknown error';
  const details = searchParams.get('details');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#402083]/5 to-slate-50 p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-3xl mb-8 border-2 border-red-200">
          <ShieldAlert className="w-12 h-12 text-red-500" strokeWidth={2} />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-3">Something went wrong</h2>
        <p className="text-slate-600 mb-6">An error occurred during authentication.</p>

        <div className="mb-8 p-5 bg-red-50 rounded-2xl border-2 border-red-100 text-left">
          <p className="text-sm font-mono text-red-700 break-all leading-relaxed">{error}</p>
          {details && (
            <p className="text-xs font-mono text-red-500 mt-3 pt-3 border-t border-red-200 break-all leading-relaxed">
              {details}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
          <div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
