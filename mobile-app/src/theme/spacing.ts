/** Spacing (4px grid) and radii — all responsively scaled. */
import { ms } from './scale';

export const spacing = {
  none: 0,
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  base: ms(16),
  lg: ms(20),
  xl: ms(24),
  '2xl': ms(32),
  '3xl': ms(40),
  '4xl': ms(56),
  '5xl': ms(72),
} as const;

export const radius = {
  none: 0,
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  '2xl': ms(24),
  '3xl': ms(32),
  full: 9999,
} as const;

/** Screen horizontal gutter — equivalent to the web `container-px`. */
export const screenPadding = spacing.lg;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
