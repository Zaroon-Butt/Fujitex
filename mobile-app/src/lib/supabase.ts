// URL polyfill must be imported before the supabase client is created in RN.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from './env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No deep-link-based session detection in a native app.
    detectSessionInUrl: false,
  },
});

// Supabase recommends pausing token auto-refresh while the app is backgrounded
// and resuming it on foreground — keeps the session alive without wasted work.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
