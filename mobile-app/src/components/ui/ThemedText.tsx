import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  lineHeight,
  useColors,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type Variant =
  | 'displayLg'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyLg'
  | 'caption'
  | 'label'
  | 'overline'
  | 'price';

const makeVariants = (colors: ThemeColors): Record<Variant, TextStyle> => ({
  displayLg: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    color: colors.text,
  },
  display: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    color: colors.text,
  },
  h1: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.snug,
    color: colors.text,
  },
  h2: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    color: colors.text,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    color: colors.text,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.snug,
    color: colors.text,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    color: colors.text,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.text,
  },
  overline: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.primaryDark,
  },
});

const WEIGHTS = {
  regular: fontFamily.regular,
  medium: fontFamily.medium,
  semibold: fontFamily.semibold,
  bold: fontFamily.bold,
} as const;

export interface ThemedTextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  weight?: keyof typeof WEIGHTS;
  align?: TextStyle['textAlign'];
  muted?: boolean;
  /** Override line-height multiplier relative to the variant's font size. */
  leading?: keyof typeof lineHeight;
}

/**
 * Cap how far the OS "Display / Font size" accessibility setting can enlarge
 * text. Our font sizes already scale per-device via `font()` (size-matters), so
 * we still honour the user's preference — but only up to 1.3× so very large
 * system settings on small/budget phones can't overflow fixed-height rows,
 * badges and buttons and clip the text.
 */
const MAX_FONT_SCALE = 1.3;

export function ThemedText({
  variant = 'body',
  color,
  weight,
  align,
  muted,
  leading,
  style,
  ...rest
}: ThemedTextProps) {
  const colors = useColors();
  const VARIANTS = useThemedStyles(makeVariants);
  const base = VARIANTS[variant];
  const override: TextStyle = {};
  if (color) override.color = color;
  else if (muted) override.color = colors.textMuted;
  if (weight) override.fontFamily = WEIGHTS[weight];
  if (align) override.textAlign = align;
  if (leading && base.fontSize) override.lineHeight = (base.fontSize as number) * lineHeight[leading];

  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...rest} style={[base, override, style]} />;
}
