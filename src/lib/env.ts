// Centralized env access with fail-fast validation in dev.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STORE_NAME: string;
  STORE_OUTLET_URL: string;
  HERO_IMAGE_URL: string;
}

function read(key: string, fallback?: string): string {
  const value = import.meta.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing env var ${key}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function readOptional(key: string, fallback = ''): string {
  return (import.meta.env[key] as string | undefined) ?? fallback;
}

export const env: Env = {
  SUPABASE_URL: read('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: read('VITE_SUPABASE_ANON_KEY'),
  STORE_NAME: read('VITE_STORE_NAME', 'Fujitex'),
  STORE_OUTLET_URL: read(
    'VITE_STORE_OUTLET_URL',
    'https://share.google/1EHLuB2CkEx7AAHgT',
  ),
  HERO_IMAGE_URL: readOptional('VITE_HERO_IMAGE_URL'),
};
