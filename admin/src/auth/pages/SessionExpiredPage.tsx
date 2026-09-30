import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Clock } from 'lucide-react';

export function SessionExpiredPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#402083]/5 to-slate-50 p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-100 rounded-3xl mb-8 border-2 border-amber-200">
          <Clock className="w-12 h-12 text-amber-600" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Session expired</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Your login session has expired. Please sign in again to continue.
        </p>
        <Button onClick={() => navigate('/login')}>Sign in</Button>
      </div>
    </div>
  );
}
