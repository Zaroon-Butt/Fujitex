import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  /** Scale at the bottom of the press. */
  activeScale?: number;
  /** Fire a light haptic tap on press. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pressable with a springy scale-down on press — the tactile feel that makes
 * cards and buttons feel premium. Used everywhere a tap happens.
 */
export function PressableScale({
  children,
  activeScale = 0.96,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  style,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(activeScale, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 140 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && !disabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
