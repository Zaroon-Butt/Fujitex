/**
 * Responsive scaling helpers (wrap react-native-size-matters).
 * Every spacing / size / font value in the app flows through one of these so
 * the UI adapts from a 320px-wide budget Android to a tablet.
 *
 *   s(n)   — horizontal scale (widths, horizontal padding)
 *   vs(n)  — vertical scale (heights, vertical padding)
 *   ms(n)  — moderate scale (the safe default for most sizes)
 *   mvs(n) — moderate vertical scale
 *   font(n)— font sizing, capped so text never gets absurdly large on tablets
 */
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export const s = (size: number) => scale(size);
export const vs = (size: number) => verticalScale(size);
export const ms = (size: number, factor = 0.5) => moderateScale(size, factor);
export const mvs = (size: number, factor = 0.5) => moderateScale(size, factor);

/** Fonts scale gently (factor 0.3) so they stay readable but never balloon. */
export const font = (size: number) => Math.round(moderateScale(size, 0.3));
