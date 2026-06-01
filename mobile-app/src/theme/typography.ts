/**
 * Typography scale. Two families mirror the web:
 *   display = Playfair Display (serif) for headings / brand voice
 *   sans    = Inter for everything else
 * Font keys map to the @expo-google-fonts module exports loaded in the root layout.
 */
import { font } from './scale';

export const fontFamily = {
  // Inter
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // Playfair Display
  displayMedium: 'PlayfairDisplay_500Medium',
  displaySemibold: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
} as const;

/** Raw sizes (run through `font()` so they scale responsively). */
export const fontSize = {
  xs: font(11),
  sm: font(13),
  base: font(15),
  md: font(16),
  lg: font(18),
  xl: font(20),
  '2xl': font(24),
  '3xl': font(28),
  '4xl': font(34),
  '5xl': font(42),
  '6xl': font(52),
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  tighter: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.2,
  widest: 2.4,
} as const;

export type FontWeightToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
