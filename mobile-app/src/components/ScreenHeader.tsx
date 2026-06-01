import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartCount } from '@/features/cart/store';
import { font, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

interface ScreenHeaderProps {
  title?: string;
  /** Show a cart button on the right with a live badge. */
  showCart?: boolean;
  /** Transparent header for full-bleed screens (e.g. product hero). */
  transparent?: boolean;
  tintColor?: string;
}

export function ScreenHeader({
  title,
  showCart = false,
  transparent = false,
  tintColor,
}: ScreenHeaderProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const count = useCartCount();
  const fg = tintColor ?? (transparent ? colors.white : colors.text);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + spacing.xs },
        transparent
          ? styles.transparent
          : { backgroundColor: colors.bg, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <PressableScale onPress={back} style={[styles.circle, transparent && styles.circleScrim]} activeScale={0.9}>
        <Icon name="chevron-left" size={24} color={fg} />
      </PressableScale>

      {!!title && (
        <ThemedText variant="title" color={fg} numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
      )}

      <View style={styles.right}>
        {showCart && (
          <PressableScale
            onPress={() => router.push('/cart')}
            style={[styles.circle, transparent && styles.circleScrim]}
            activeScale={0.9}
          >
            <Icon name="shopping-bag" size={20} color={fg} />
            {count > 0 && (
              <View style={styles.badge}>
                <ThemedText weight="bold" color={colors.ink} style={styles.badgeText}>
                  {count > 99 ? '99+' : count}
                </ThemedText>
              </View>
            )}
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const HIT = ms(40);

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  transparent: { backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  title: { flex: 1 },
  right: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: HIT,
    height: HIT,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleScrim: { backgroundColor: 'rgba(10,10,10,0.32)' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: ms(16),
    height: ms(16),
    paddingHorizontal: ms(3),
    borderRadius: radius.full,
    backgroundColor: colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
    ...shadows.sm,
  },
  badgeText: { fontSize: font(9), lineHeight: font(11) },
});
