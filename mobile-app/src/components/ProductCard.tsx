import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCartActions, useIsInCart } from '@/features/cart/store';
import { productToCartItem, isPurchasable } from '@/features/cart/mapper';
import { discountPct, formatPKR } from '@/lib/format';
import { font, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import type { ProductWithImages } from '@/types/database';
import { Chip } from './ui/Chip';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

const BLUR_PLACEHOLDER = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

interface ProductCardProps {
  product: ProductWithImages;
  /** Index in a grid — drives the staggered entrance animation. */
  index?: number;
  style?: ViewStyle;
}

export function ProductCard({ product, index = 0, style }: ProductCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { add } = useCartActions();
  const inCart = useIsInCart(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const primary = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0];
  const off = discountPct(product.price_paisas, product.compare_at_paisas);
  const purchasable = isPurchasable(product);

  const addScale = useSharedValue(1);
  const addBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: addScale.value }] }));

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1100);
    return () => clearTimeout(t);
  }, [justAdded]);

  function handleAdd() {
    if (!purchasable) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    add(productToCartItem(product));
    setJustAdded(true);
    addScale.value = withSequence(
      withTiming(1.28, { duration: 140 }),
      withTiming(1, { duration: 160 }),
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 55)
        .duration(420)
        .springify()
        .damping(16)}
      style={style}
    >
      <PressableScale
        activeScale={0.97}
        onPress={() => router.push(`/product/${product.slug}`)}
        style={styles.card}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image
            source={primary?.url}
            placeholder={{ blurhash: BLUR_PLACEHOLDER }}
            contentFit="cover"
            transition={250}
            style={styles.image}
          />
          {/* subtle bottom scrim for legibility of floating elements */}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.18)'] as const}
            style={[StyleSheet.absoluteFill, styles.scrim]}
          />

          {/* Top-left badges */}
          <View style={styles.topLeft}>
            {off != null && <Chip label={`-${off}%`} tone="solid-gold" />}
            {product.status === 'low_stock' && purchasable && (
              <Chip label={`Only ${product.stock_units} left`} tone="rose" />
            )}
          </View>

          {/* Add-to-cart floating button */}
          <Animated.View style={[styles.addBtnWrap, addBtnStyle]}>
            <PressableScale
              onPress={handleAdd}
              disabled={!purchasable}
              activeScale={0.85}
              style={[
                styles.addBtn,
                {
                  backgroundColor: !purchasable
                    ? colors.neutral[400]
                    : justAdded
                      ? colors.gold[500]
                      : colors.primary,
                },
              ]}
            >
              {justAdded ? (
                <Animated.View entering={FadeIn.duration(150)} key="check">
                  <Icon name="check" size={18} color={colors.ink} />
                </Animated.View>
              ) : (
                <Icon name={inCart ? 'shopping-bag' : 'plus'} size={18} color={colors.white} />
              )}
            </PressableScale>
          </Animated.View>

          {!purchasable && (
            <View style={styles.soldOut}>
              <Chip label="Sold out" tone="neutral" />
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          {!!product.fabric_type && (
            <ThemedText variant="overline" numberOfLines={1}>
              {product.fabric_type}
            </ThemedText>
          )}
          <ThemedText variant="label" weight="semibold" numberOfLines={1} style={styles.name}>
            {product.name}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText variant="price" style={styles.price}>
              {formatPKR(product.price_paisas)}
            </ThemedText>
            {off != null && (
              <ThemedText variant="caption" style={styles.compare}>
                {formatPKR(product.compare_at_paisas!)}
              </ThemedText>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.md,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  scrim: { pointerEvents: 'none' },
  topLeft: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    gap: spacing.xs,
  },
  addBtnWrap: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    ...shadows.brand,
  },
  addBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  soldOut: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  meta: {
    padding: spacing.md,
    gap: 3,
  },
  name: { color: colors.text },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: 2,
  },
  price: { fontSize: font(15) },
  compare: {
    textDecorationLine: 'line-through',
    color: colors.textSubtle,
  },
});
