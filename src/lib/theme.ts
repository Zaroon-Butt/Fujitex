import { useSyncExternalStore } from 'react';

/**
 * Tiny theme store for the storefront. Persists the user's choice in
 * localStorage and toggles the `dark` class on <html> (Tailwind `darkMode:
 * 'class'`). First-launch default follows the OS via `prefers-color-scheme`.
 *
 * The initial class is applied pre-paint by an inline script in index.html
 * (see `applyTheme` mirror there) so there's no light flash on dark devices.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fujitex-theme';
const listeners = new Set<() => void>();

function systemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function getTheme(): Theme {
  return stored() ?? systemTheme();
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private-mode errors */
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Reactive theme value; re-renders the caller when the theme changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'light');
}
