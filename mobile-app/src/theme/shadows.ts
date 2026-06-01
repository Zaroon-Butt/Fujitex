import { Platform } from 'react-native';
import { palette } from './colors';

/**
 * Elevation presets used across cards, buttons and sheets.
 *
 * RN 0.85 / New Architecture deprecates the individual `shadow*` props
 * (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) in favour of
 * the CSS-like `boxShadow` string — using the old props floods the Metro
 * terminal with deprecation warnings. We emit `boxShadow` for both platforms
 * and keep `elevation` purely as an Android depth hint (it isn't deprecated).
 */
type Shadow = { boxShadow?: string; elevation: number };

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function make(color: string, y: number, blur: number, opacity: number, elevation: number): Shadow {
  if (color === 'transparent' || opacity === 0) return { elevation: 0 };
  // Slightly stronger on Android where boxShadow tends to render softer.
  const a = Platform.OS === 'ios' ? opacity : opacity * 1.05;
  return { boxShadow: `0px ${y}px ${blur}px 0px ${hexToRgba(color, a)}`, elevation };
}

export const shadows = {
  none: make('transparent', 0, 0, 0, 0),
  sm: make(palette.ink, 2, 4, 0.08, 2),
  md: make(palette.ink, 6, 12, 0.12, 5),
  lg: make(palette.ink, 12, 24, 0.16, 10),
  brand: make(palette.brand[700], 8, 18, 0.35, 8),
  gold: make(palette.gold[600], 8, 18, 0.35, 8),
} as const;

export type ShadowToken = keyof typeof shadows;
