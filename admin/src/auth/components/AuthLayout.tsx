import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#402083]/5 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#402083]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#402083]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#FFD75A]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#402083] to-[#3D2081] rounded-3xl mb-6 shadow-2xl shadow-[#402083]/40">
            <span className="text-4xl font-bold text-white">B</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 bg-gradient-to-r from-[#402083] via-slate-900 to-[#402083] bg-clip-text text-transparent">
            Bariisaa Tv
          </h1>
          <p className="text-slate-600">Your digital library companion</p>
        </div>

        <div className="card-float">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed animate-fade-in">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#402083] hover:text-[#3D2081] font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
            Terms
          </a>
          {' '}and{' '}
          <a href="#" className="text-[#402083] hover:text-[#3D2081] font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
