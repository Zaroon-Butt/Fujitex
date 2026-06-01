import { StyleSheet, View, type ViewStyle } from 'react-native';
import { font, radius, spacing, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon, type IconName } from './Icon';
import { ThemedText } from './ThemedText';

type Tone = 'brand' | 'gold' | 'rose' | 'neutral' | 'danger' | 'solid-gold';

const makeTones = (colors: ThemeColors): Record<Tone, { bg: string; fg: string }> => ({
  brand: { bg: colors.brand[100], fg: colors.brand[800] },
  gold: { bg: colors.gold[100], fg: colors.gold[800] },
  rose: { bg: colors.rose[100], fg: colors.rose[700] },
  neutral: { bg: colors.neutral[100], fg: colors.neutral[700] },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  'solid-gold': { bg: colors.gold[500], fg: colors.ink },
});

interface ChipProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  style?: ViewStyle;
}

export function Chip({ label, tone = 'brand', icon, style }: ChipProps) {
  const TONES = useThemedStyles(makeTones);
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      {icon && <Icon name={icon} size={12} color={t.fg} />}
      <ThemedText weight="semibold" color={t.fg} style={styles.text}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  text: { fontSize: font(11), letterSpacing: 0.3 },
});
