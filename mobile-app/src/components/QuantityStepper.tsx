import * as Haptics from 'expo-haptics';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ms, radius, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
  style,
}: QuantityStepperProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const btn = ms(size === 'sm' ? 28 : 36);
  const iconSize = size === 'sm' ? 14 : 18;
  const canDec = value > min;
  const canInc = max === undefined || value < max;

  const step = (delta: number, enabled: boolean) => () => {
    if (!enabled) return;
    Haptics.selectionAsync();
    onChange(value + delta);
  };

  return (
    <View style={[styles.wrap, style]}>
      <PressableScale
        onPress={step(-1, canDec)}
        disabled={!canDec}
        style={[styles.btn, { width: btn, height: btn, opacity: canDec ? 1 : 0.35 }]}
      >
        <Icon name="minus" size={iconSize} color={colors.primaryDark} />
      </PressableScale>

      <ThemedText weight="bold" style={styles.value}>
        {value}
      </ThemedText>

      <PressableScale
        onPress={step(1, canInc)}
        disabled={!canInc}
        style={[styles.btn, { width: btn, height: btn, opacity: canInc ? 1 : 0.35 }]}
      >
        <Icon name="plus" size={iconSize} color={colors.primaryDark} />
      </PressableScale>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    padding: spacing.xs,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  btn: {
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: ms(28),
    textAlign: 'center',
    color: colors.primaryDarker,
  },
});
