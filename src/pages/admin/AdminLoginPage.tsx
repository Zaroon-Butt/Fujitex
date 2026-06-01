import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export function AdminLoginPage() {
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
    if (error) { setError(error.message); return; }
    navigate('/admin', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-brand-950 to-emerald-950 p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-rose-600/15 blur-3xl" />

      <form onSubmit={handleSubmit} className="relative w-full max-w-sm bg-white dark:bg-night-800 border border-transparent dark:border-night-600 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
          <Shield className="h-5 w-5" />
          <p className="text-xs font-bold uppercase tracking-widest">Admin access</p>
        </div>
        <h1 className="font-display text-2xl text-ink dark:text-neutral-100 mt-3">Fujitex management</h1>

        <div className="mt-6">
          <label className="input-label">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
        </div>
        <div className="mt-4">
          <label className="input-label">Password</label>
          <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>

        {error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          MFA (TOTP) can be enabled in Supabase Auth settings — wire the challenge step here once enrolled.
        </p>
      </form>
    </div>
  );
}
