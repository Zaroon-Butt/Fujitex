import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, shadows, useThemedStyles, type ThemeColors } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

/** Plain white surface card — matches the web `.card` utility. */
export function Card({ children, style, elevated = true }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.card, elevated && shadows.sm, style]}>{children}</View>;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius['2xl'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  });
