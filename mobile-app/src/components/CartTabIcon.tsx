import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useCartCount } from '@/features/cart/store';
import { font, ms, radius, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon } from './ui/Icon';
import { ThemedText } from './ui/ThemedText';

/** Bottom-tab cart icon with a live, bouncing item-count badge. */
export function CartTabIcon({ color, size }: { color: string; size: number }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const count = useCartCount();
  const scale = useSharedValue(1);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1));
    }
  }, [count, scale]);

  return (
    <View>
      <Icon name="shopping-bag" size={size} color={color} />
      {count > 0 && (
        <Animated.View style={[styles.badge, badgeStyle]}>
          <ThemedText weight="bold" color={colors.ink} style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </ThemedText>
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: ms(18),
    height: ms(18),
    paddingHorizontal: ms(4),
    borderRadius: radius.full,
    backgroundColor: colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: { fontSize: font(10), lineHeight: font(12) },
});
