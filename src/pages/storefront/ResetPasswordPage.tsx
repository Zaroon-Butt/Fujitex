import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Supabase appends link errors (invalid/expired) to the URL hash — read once.
  const [linkError] = useState<string | null>(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const errDesc = hash.get('error_description');
    return errDesc ? errDesc.replace(/\+/g, ' ') : null;
  });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // The recovery link lands here with the token in the URL hash. The Supabase
  // client (detectSessionInUrl) exchanges it for a session and fires
  // PASSWORD_RECOVERY — we wait for that before allowing a new password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });
    // The event may have fired before this listener attached — check directly.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/account', { replace: true });
  }

  return (
    <>
      <Helmet><title>Set a new password — Fujitex</title></Helmet>
      <section className="min-h-[calc(100svh-4rem)] grid lg:grid-cols-2">
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-700 via-emerald-800 to-emerald-950 p-12 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="relative max-w-md text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure reset
            </span>
            <h2 className="font-display text-4xl mt-5 leading-tight">
              Choose a strong new password to finish securing your account.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Set a new password</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Enter and confirm your new password.</p>

            {linkError ? (
              <div className="mt-6 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-4 text-sm text-rose-700 dark:text-rose-300">
                <p className="font-semibold">This reset link is invalid or has expired.</p>
                <p className="mt-1">{linkError}</p>
                <Link to="/forgot-password" className="mt-3 inline-block font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                  Request a new link
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label className="input-label">New password</label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">At least 8 characters.</p>
                </div>
                <div className="mt-4">
                  <label className="input-label">Confirm new password</label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
                {!ready && (
                  <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                    Open this page from the reset link in your email to continue.
                  </p>
                )}

                <button type="submit" disabled={loading || !ready} className="btn-primary mt-6 w-full">
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </>
            )}

            <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
              <Link to="/signin" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">Back to sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
