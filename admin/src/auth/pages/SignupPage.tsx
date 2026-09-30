import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { apiPost } from '../lib/api';
import { z } from 'zod';
import { User, Phone, Mail, Lock, AlertCircle } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number').regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const result = signupSchema.safeParse({ name, phone, email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await apiPost('/auth/signup/email', { name, phone, email, password });

      const params = new URLSearchParams(window.location.search);
      const redirectUri = params.get('redirect_uri');
      const clientId = params.get('client_id');
      const state = params.get('state');
      const codeChallenge = params.get('code_challenge');

      if (redirectUri && clientId && state && codeChallenge) {
        navigate(`/verify-otp?phone=${encodeURIComponent(phone)}&redirect_uri=${redirectUri}&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&scope=${params.get('scope') || 'openid profile email'}`);
      } else {
        navigate(`/verify-otp?phone=${encodeURIComponent(phone)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h2>
        <p className="text-slate-600">Start your journey with Bariisaa Tv</p>
      </div>

      {error && (
        <div className="error-alert mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          icon={<User className="w-5 h-5" />}
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="+251 9XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
          helpText="We'll send a verification code to this number"
          icon={<Phone className="w-5 h-5" />}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          icon={<Mail className="w-5 h-5" />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          helpText="Use a strong password with letters, numbers & symbols"
          icon={<Lock className="w-5 h-5" />}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          icon={<Lock className="w-5 h-5" />}
        />

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="w-4 h-4 mt-1 rounded border-slate-300 text-[#402083] focus:ring-[#402083]/30 transition-all"
          />
          <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
            I agree to the{' '}
            <a href="#" className="text-[#402083] hover:text-[#3D2081] font-semibold hover:underline decoration-2 underline-offset-2">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className="text-[#402083] hover:text-[#3D2081] font-semibold hover:underline decoration-2 underline-offset-2">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-[#402083] hover:text-[#3D2081] transition-colors hover:underline decoration-2 underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
