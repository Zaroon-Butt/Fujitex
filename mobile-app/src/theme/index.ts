export { colors, lightColors, darkColors, palette, gradients } from './colors';
export type { ColorToken, ThemeColors } from './colors';
export { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
export type { FontWeightToken, FontSizeToken } from './typography';
export { spacing, radius, screenPadding } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';
export { shadows } from './shadows';
export type { ShadowToken } from './shadows';
export { s, vs, ms, mvs, font } from './scale';

import { useMemo } from 'react';
import { colors, lightColors, darkColors, gradients, type ThemeColors } from './colors';
import { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
import { spacing, radius, screenPadding } from './spacing';
import { shadows } from './shadows';
import { useColorScheme } from '@/features/theme/store';

/** Active color set for the current scheme. Re-renders the caller on toggle. */
export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

/**
 * Build a themed StyleSheet that flips with the active scheme. Pass a
 * module-level factory so the memo key is just the scheme:
 *
 *   const makeStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   // inside the component:
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (c: ThemeColors) => T): T {
  const scheme = useColorScheme();
  return useMemo(
    () => factory(scheme === 'dark' ? darkColors : lightColors),
    [factory, scheme],
  );
}

export { useColorScheme, useIsDark, useThemeActions } from '@/features/theme/store';
export type { ColorScheme } from '@/features/theme/store';

/** Single aggregated theme object for ergonomic `theme.colors.x` access. */
export const theme = {
  colors,
  gradients,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  screenPadding,
  shadows,
} as const;

export type Theme = typeof theme;
