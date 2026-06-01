import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

interface Props { children: ReactNode }

export function RequireStaff({ children }: Props) {
  const [state, setState] = useState<'loading' | 'allow' | 'deny'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState('deny');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role as UserRole | undefined;
      if (!cancelled) setState(role === 'admin' || role === 'manager' ? 'allow' : 'deny');
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500">Checking access…</div>;
  }
  if (state === 'deny') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
