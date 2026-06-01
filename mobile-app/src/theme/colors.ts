/**
 * Color tokens — ported 1:1 from the Fujitex web Tailwind config so the
 * mobile app stays visually consistent with the storefront.
 *   brand  = vibrant emerald (primary, Pakistani jewel tone)
 *   gold   = amber accent
 *   rose   = secondary
 *   cream  = app background, ink = near-black text
 *
 * Two themes share this raw scale: `lightColors` (the original storefront look)
 * and `darkColors` (an emerald-tinted dark palette). Components resolve the
 * active set at render time via `useColors()` / `useThemedStyles()` so the whole
 * app flips when the user toggles dark mode. The two objects MUST keep an
 * identical key shape — `ThemeColors` is derived from the light one.
 */
export const palette = {
  brand: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  rose: {
    50: '#fdf2f8',
    100: '#fce7f3',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  amber: { 700: '#b45309' },
  red: { 600: '#dc2626', 700: '#b91c1c' },
  cream: '#fef9ef',
  ink: '#0a0a0a',
  white: '#ffffff',
  black: '#000000',
} as const;

/**
 * Build a full semantic color set from the shared raw scale plus per-theme
 * overrides. `ink` deliberately stays near-black in BOTH themes (it's a fill /
 * brand-ink token, e.g. the gold button label and dark overlays) — text that
 * needs to flip uses the `text` token instead.
 */
function buildColors(opts: {
  /** Nested scale overrides (soft fills that must darken in dark mode). */
  brand50: string;
  brand100: string;
  gold50: string;
  gold100: string;
  rose100: string;
  neutral100: string;
  neutral200: string;
  // Semantic tokens
  primary: string;
  primaryDark: string;
  primaryDarker: string;
  accent: string;
  accentSoft: string;
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  success: string;
  danger: string;
  dangerSoft: string;
  warning: string;
}) {
  return {
    ...palette,
    brand: { ...palette.brand, 50: opts.brand50, 100: opts.brand100 },
    gold: { ...palette.gold, 50: opts.gold50, 100: opts.gold100 },
    rose: { ...palette.rose, 100: opts.rose100 },
    neutral: { ...palette.neutral, 100: opts.neutral100, 200: opts.neutral200 },

    primary: opts.primary,
    primaryDark: opts.primaryDark,
    primaryDarker: opts.primaryDarker,
    accent: opts.accent,
    accentSoft: opts.accentSoft,

    bg: opts.bg,
    surface: opts.surface,
    surfaceMuted: opts.surfaceMuted,

    text: opts.text,
    textMuted: opts.textMuted,
    textSubtle: opts.textSubtle,
    textInverse: opts.textInverse,

    border: opts.border,
    borderStrong: opts.borderStrong,

    success: opts.success,
    danger: opts.danger,
    dangerSoft: opts.dangerSoft,
    warning: opts.warning,
  };
}

/** Light theme — the original storefront look. */
export const lightColors = buildColors({
  brand50: palette.brand[50],
  brand100: palette.brand[100],
  gold50: palette.gold[50],
  gold100: palette.gold[100],
  rose100: palette.rose[100],
  neutral100: palette.neutral[100],
  neutral200: palette.neutral[200],

  primary: palette.brand[600],
  primaryDark: palette.brand[700],
  primaryDarker: palette.brand[900],
  accent: palette.gold[500],
  accentSoft: palette.gold[400],

  bg: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.neutral[100],

  text: palette.neutral[900],
  textMuted: palette.neutral[500],
  textSubtle: palette.neutral[400],
  textInverse: palette.white,

  border: palette.neutral[200],
  borderStrong: palette.neutral[300],

  success: palette.brand[600],
  danger: palette.red[600],
  dangerSoft: '#fee2e2',
  warning: palette.amber[700],
});

/** Dark theme — warm, emerald-tinted dark surfaces; brand stays emerald/gold. */
export const darkColors = buildColors({
  // Soft fills become translucent jewel tints so they read on dark surfaces.
  brand50: 'rgba(16,185,129,0.14)',
  brand100: 'rgba(16,185,129,0.22)',
  gold50: 'rgba(245,158,11,0.14)',
  gold100: 'rgba(245,158,11,0.22)',
  rose100: 'rgba(236,72,153,0.20)',
  neutral100: '#1c231f',
  neutral200: '#2a322d',

  // Lift accents so emerald text stays legible on dark.
  primary: palette.brand[500],
  primaryDark: palette.brand[400],
  primaryDarker: palette.brand[300],
  accent: palette.gold[400],
  accentSoft: palette.gold[300],

  bg: '#0b0f0d',
  surface: '#141916',
  surfaceMuted: '#1c231f',

  text: '#f4f5f3',
  textMuted: '#9aa39d',
  textSubtle: '#6b746d',
  textInverse: palette.white,

  border: '#262d28',
  borderStrong: '#333b35',

  success: palette.brand[400],
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  warning: palette.gold[400],
});

/**
 * Default static export — points at the light set. Use this only where a theme
 * hook can't run (module-load constants, the pre-hydration splash). Everything
 * that should react to the toggle must use `useColors()` / `useThemedStyles()`.
 */
export const colors = lightColors;

/** Shape every component styles against — both themes satisfy it. */
export type ThemeColors = typeof lightColors;

/** Reusable gradient stops (consumed by expo-linear-gradient). Theme-agnostic:
 *  the emerald/gold brand gradients read well on both light and dark. */
export const gradients = {
  hero: ['#064e3b', '#065f46', '#022c22'] as const,        // brand-900 → 800 → emerald-950
  brand: ['#047857', '#064e3b'] as const,                  // brand-700 → 900
  gold: ['#fbbf24', '#d97706'] as const,                   // gold-400 → 600
  rose: ['#db2777', '#9d174d'] as const,                   // rose-600 → 800
  ink: ['#0a0a0a', '#022c22', '#064e3b'] as const,         // ink → emerald-950 → brand-900
  card: ['#059669', '#047857'] as const,
} as const;

export type ColorToken = keyof typeof colors;
