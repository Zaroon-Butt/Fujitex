import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/account', { replace: true });
  }

  return (
    <>
      <Helmet><title>Sign in — Fujitex</title></Helmet>
      <section className="min-h-[calc(100svh-4rem)] grid lg:grid-cols-2">
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-700 via-emerald-800 to-emerald-950 p-12 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="relative max-w-md text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-200">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back
            </span>
            <h2 className="font-display text-4xl mt-5 leading-tight">
              Sign in to track orders, save favourites, and check out faster.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Sign in</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Welcome back to Fujitex.</p>

            <div className="mt-6">
              <label className="input-label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="input-label">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
              New to Fujitex?{' '}
              <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
