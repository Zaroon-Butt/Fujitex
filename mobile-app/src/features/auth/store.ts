import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

const STAFF_ROLES: UserRole[] = ['admin', 'manager'];

interface AuthState {
  initialized: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Subscribe to Supabase auth changes. Call once at app start; returns an unsub. */
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  /** Email the user a 6-digit recovery code (Supabase OTP, type=recovery). */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Verify the recovery code, then set the new password. */
  resetPassword: (
    email: string,
    token: string,
    newPassword: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: true,
  session: null,
  user: null,
  profile: null,

  init: () => {
    // Hydrate the persisted session, then keep it live.
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session ?? null;
      const profile = session?.user ? await fetchProfile(session.user.id) : null;
      set({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
        initialized: true,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user ? await fetchProfile(session.user.id) : null;
      set({ session, user: session?.user ?? null, profile, loading: false });
    });

    return () => sub.subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  },

  requestPasswordReset: async (email) => {
    // Native app: no deep links, so we use the OTP code flow. Supabase emails a
    // recovery code; the reset screen verifies it with verifyOtp(type:recovery).
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error?.message ?? null };
  },

  resetPassword: async (email, token, newPassword) => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'recovery',
    });
    if (verifyError) return { error: verifyError.message };
    // verifyOtp established a session — now we can set the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return { error: updateError?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    set({ profile: await fetchProfile(user.id) });
  },
}));

/* ----------------------------- selector hooks ----------------------------- */

export const useUser = () => useAuthStore((s) => s.user);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useIsStaff = () =>
  useAuthStore((s) => !!s.profile && STAFF_ROLES.includes(s.profile.role));

export const useAuthActions = () =>
  useAuthStore(
    useShallow((s) => ({
      signIn: s.signIn,
      signUp: s.signUp,
      requestPasswordReset: s.requestPasswordReset,
      resetPassword: s.resetPassword,
      signOut: s.signOut,
      refreshProfile: s.refreshProfile,
    })),
  );
