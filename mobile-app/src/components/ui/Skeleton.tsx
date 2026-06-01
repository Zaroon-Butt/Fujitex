import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ms, radius, useColors } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Scale a numeric dimension with the device; leave `%`/`auto` values untouched. */
const scaleDim = (v: DimensionValue): DimensionValue => (typeof v === 'number' ? ms(v) : v);

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const colors = useColors();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: scaleDim(width),
          height: scaleDim(height),
          // borderRadius callers pass already-scaled `radius.*` tokens (or 0).
          borderRadius,
          backgroundColor: colors.neutral[200],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
