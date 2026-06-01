import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { KeyRound, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <>
      <Helmet><title>Reset password — Fujitex</title></Helmet>
      <section className="min-h-[calc(100svh-4rem)] grid lg:grid-cols-2">
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-700 via-emerald-800 to-emerald-950 p-12 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="relative max-w-md text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-200">
              <KeyRound className="h-3.5 w-3.5" /> Account recovery
            </span>
            <h2 className="font-display text-4xl mt-5 leading-tight">
              Forgot your password? We'll email you a secure link to set a new one.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          {sent ? (
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="font-display text-3xl text-ink dark:text-neutral-100 mt-5">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                If an account exists for <span className="font-medium text-ink dark:text-neutral-200">{email}</span>, we've
                sent a link to reset your password. The link expires in 1 hour.
              </p>
              <Link to="/signin" className="btn-primary mt-6 w-full inline-flex justify-center">
                Back to sign in
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Reset password</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Enter your account email and we'll send you a reset link.
              </p>

              <div className="mt-6">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
                Remembered it?{' '}
                <Link to="/signin" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
