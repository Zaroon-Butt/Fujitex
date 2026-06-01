import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data.session) {
      setNotice('Check your email to confirm your account, then sign in.');
      return;
    }
    navigate('/account', { replace: true });
  }

  return (
    <>
      <Helmet><title>Create account — Fujitex</title></Helmet>
      <section className="min-h-[calc(100svh-4rem)] grid lg:grid-cols-2">
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-rose-700 via-rose-800 to-brand-900 p-12 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="relative max-w-md text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-200">
              <Sparkles className="h-3.5 w-3.5" /> Join Fujitex
            </span>
            <h2 className="font-display text-4xl mt-5 leading-tight">
              Create your account to shop premium fabric, faster.
            </h2>
            <ul className="mt-6 space-y-2 text-white/85 text-sm">
              <li>· Save addresses for one-tap checkout</li>
              <li>· Track every order in real time</li>
              <li>· Early access to seasonal drops</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Create account</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">It only takes a minute.</p>

            <div className="mt-6">
              <label className="input-label">Full name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" autoComplete="name" />
            </div>
            <div className="mt-4">
              <label className="input-label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
            </div>
            <div className="mt-4">
              <label className="input-label">Phone (Pakistan)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="03XX XXXXXXX"
                autoComplete="tel"
              />
            </div>
            <div className="mt-4">
              <label className="input-label">Password</label>
              <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">At least 8 characters.</p>
            </div>

            {error  && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
            {notice && <p className="mt-3 text-sm text-brand-700 dark:text-brand-300">{notice}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
