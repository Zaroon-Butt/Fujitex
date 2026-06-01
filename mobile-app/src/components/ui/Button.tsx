import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { font, gradients, radius, shadows, spacing, useColors, type ThemeColors } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { ThemedText } from './ThemedText';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZES: Record<Size, { padV: number; padH: number; font: number; icon: number }> = {
  sm: { padV: spacing.sm, padH: spacing.base, font: font(13), icon: 16 },
  md: { padV: spacing.md, padH: spacing.lg, font: font(15), icon: 18 },
  lg: { padV: spacing.base, padH: spacing.xl, font: font(16), icon: 20 },
};

function paletteFor(variant: Variant, colors: ThemeColors): {
  bg?: string;
  text: string;
  border?: string;
  shadow?: ViewStyle;
} {
  switch (variant) {
    case 'primary':
      return { bg: colors.primary, text: colors.white, shadow: shadows.brand };
    case 'gold':
      return { text: colors.ink, shadow: shadows.gold }; // gradient drawn separately
    case 'outline':
      return { bg: 'transparent', text: colors.primaryDark, border: colors.primary };
    case 'ghost':
      return { bg: 'transparent', text: colors.text };
    case 'light':
      return { bg: 'rgba(255,255,255,0.12)', text: colors.white, border: 'rgba(255,255,255,0.35)' };
    case 'dark':
      return { bg: colors.ink, text: colors.white, shadow: shadows.md };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const colors = useColors();
  const sz = SIZES[size];
  const pal = paletteFor(variant, colors);
  const isDisabled = disabled || loading;

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={pal.text} size="small" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={sz.icon} color={pal.text} />}
          <ThemedText weight="semibold" color={pal.text} style={{ fontSize: sz.font }}>
            {label}
          </ThemedText>
          {rightIcon && <Icon name={rightIcon} size={sz.icon} color={pal.text} />}
        </>
      )}
    </View>
  );

  const contentStyle: ViewStyle = {
    paddingVertical: sz.padV,
    paddingHorizontal: sz.padH,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const wrapperStyle: ViewStyle = {
    borderRadius: radius.full,
    opacity: isDisabled ? 0.55 : 1,
    ...(fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }),
    ...(pal.shadow ?? {}),
    ...style,
  };

  if (variant === 'gold') {
    return (
      <PressableScale haptic onPress={onPress} disabled={isDisabled} style={wrapperStyle}>
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={contentStyle}
        >
          {inner}
        </LinearGradient>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      haptic
      onPress={onPress}
      disabled={isDisabled}
      style={{
        ...wrapperStyle,
        ...contentStyle,
        backgroundColor: pal.bg,
        ...(pal.border ? { borderWidth: 1.5, borderColor: pal.border } : {}),
      }}
    >
      {inner}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
