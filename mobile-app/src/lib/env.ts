/**
 * Centralized, fail-fast env access. Expo inlines `EXPO_PUBLIC_*` vars into the
 * bundle, so these are read at build time from `.env`.
 */
function read(key: string, value: string | undefined, fallback?: string): string {
  const v = value ?? fallback;
  if (!v) {
    throw new Error(
      `Missing env var ${key}. Copy .env.example to .env and fill it in, then restart the dev server.`,
    );
  }
  return v;
}

export const env = {
  SUPABASE_URL: read('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: read('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  STORE_NAME: read('EXPO_PUBLIC_STORE_NAME', process.env.EXPO_PUBLIC_STORE_NAME, 'Fujitex'),
  STORE_OUTLET_URL: read(
    'EXPO_PUBLIC_STORE_OUTLET_URL',
    process.env.EXPO_PUBLIC_STORE_OUTLET_URL,
    'https://share.google/1EHLuB2CkEx7AAHgT',
  ),
} as const;
