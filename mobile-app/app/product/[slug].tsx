import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ThemedText } from '@/components/ui/ThemedText';
import { useCartActions, useIsInCart } from '@/features/cart/store';
import { isPurchasable, productToCartItem } from '@/features/cart/mapper';
import { orderedImages, supportsStitching, useProduct } from '@/features/catalog/useProduct';
import { useStitchingPrice } from '@/features/stitching/useStitchingPrice';
import { discountPct, formatPKR } from '@/lib/format';
import { ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

const BLUR = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export default function ProductScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: product, isLoading, error } = useProduct(slug);
  const { add } = useCartActions();
  const inCart = useIsInCart(product?.id ?? '');
  const { pricePaisas: stitchingPaisas } = useStitchingPrice();

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenHeader showCart />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.base, marginTop: spacing.base }}>
          <Skeleton width="100%" height={width * 0.9} borderRadius={radius['2xl']} />
          <Skeleton width="55%" height={20} />
          <Skeleton width="40%" height={26} />
          <Skeleton width="100%" height={80} />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.root}>
        <ScreenHeader showCart />
        <EmptyState
          icon="alert-circle"
          tone="error"
          title="Product not found"
          message="This product may have been removed or is no longer available."
          actionLabel="Back to shop"
          onAction={() => router.replace('/shop')}
        />
      </View>
    );
  }

  const images = orderedImages(product);
  const off = discountPct(product.price_paisas, product.compare_at_paisas);
  const purchasable = isPurchasable(product);
  const lineTotal = product.price_paisas * qty;

  const onImgScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  function handleAdd() {
    if (!purchasable || !product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    add(productToCartItem(product), qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const meta = [
    { label: 'Fabric', value: product.fabric_type },
    { label: 'Blend', value: product.fabric_blend },
    { label: 'Color', value: product.color },
    { label: 'Occasion', value: product.occasion },
  ].filter((m) => !!m.value);

  return (
    <View style={styles.root}>
      <ScreenHeader showCart transparent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ms(120) + insets.bottom }}
      >
        {/* Image carousel */}
        <View style={{ width, height: width * 1.15, backgroundColor: colors.surfaceMuted }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onImgScroll}
            >
              {images.map((img) => (
                <Image
                  key={img.id}
                  source={img.url}
                  placeholder={{ blurhash: BLUR }}
                  contentFit="cover"
                  transition={250}
                  style={{ width, height: width * 1.15 }}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noImage}>
              <Icon name="image" size={48} color={colors.neutral[400]} />
            </View>
          )}

          {off != null && (
            <View style={[styles.discountBadge, { top: insets.top + ms(56) }]}>
              <Chip label={`${off}% OFF`} tone="solid-gold" />
            </View>
          )}

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((img, i) => (
                <View key={img.id} style={[styles.dot, i === activeImg && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Detail sheet */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.sheet}>
          {!!product.fabric_type && <ThemedText variant="overline">{product.fabric_type}</ThemedText>}
          <ThemedText variant="h1" style={styles.name}>
            {product.name}
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText variant="h2" color={colors.primaryDark}>
              {formatPKR(product.price_paisas)}
            </ThemedText>
            {off != null && (
              <ThemedText variant="title" muted style={styles.compare}>
                {formatPKR(product.compare_at_paisas!)}
              </ThemedText>
            )}
          </View>

          {/* Stock state */}
          {product.status === 'low_stock' && purchasable && (
            <Chip label={`Hurry — only ${product.stock_units} left`} tone="rose" icon="zap" style={styles.stockChip} />
          )}
          {!purchasable && <Chip label="Out of stock" tone="neutral" icon="x-circle" style={styles.stockChip} />}

          {!!product.description && (
            <ThemedText variant="bodyLg" muted style={styles.description}>
              {product.description}
            </ThemedText>
          )}

          {/* Spec table */}
          {meta.length > 0 && (
            <View style={styles.specCard}>
              {meta.map((m, i) => (
                <View key={m.label} style={[styles.specRow, i < meta.length - 1 && styles.specDivider]}>
                  <ThemedText variant="caption" muted>
                    {m.label}
                  </ThemedText>
                  <ThemedText variant="label" weight="semibold">
                    {m.value}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Quantity */}
          {purchasable && (
            <View style={styles.qtyRow}>
              <ThemedText variant="title">Quantity</ThemedText>
              <QuantityStepper value={qty} onChange={setQty} min={1} max={product.stock_units} />
            </View>
          )}

          {/* Custom stitching offer — men's products only */}
          {purchasable && supportsStitching(product) && (
            <PressableScale
              onPress={() => router.push(`/stitching/${product.slug}`)}
              activeScale={0.98}
              style={styles.stitchCard}
            >
              <View style={styles.stitchIcon}>
                <Icon name="scissors" size={18} color={colors.ink} />
              </View>
              <View style={styles.stitchBody}>
                <ThemedText variant="label" weight="semibold">
                  Get it stitched to your size
                </ThemedText>
                <ThemedText variant="caption" muted>
                  Custom Shalwar Kameez · +{formatPKR(stitchingPaisas)}
                </ThemedText>
              </View>
              <Icon name="chevron-right" size={20} color={colors.primaryDark} />
            </PressableScale>
          )}

          {/* Trust row */}
          <View style={styles.trustRow}>
            {[
              { icon: 'truck' as const, label: 'Pan-PK delivery' },
              { icon: 'shield' as const, label: 'COD available' },
              { icon: 'refresh-ccw' as const, label: 'Hand-inspected' },
            ].map((t) => (
              <View key={t.label} style={styles.trustItem}>
                <Icon name={t.icon} size={16} color={colors.primary} />
                <ThemedText variant="caption" muted align="center">
                  {t.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {inCart && !added && (
          <PressableScale style={styles.viewCart} onPress={() => router.push('/cart')} activeScale={0.96}>
            <Icon name="shopping-bag" size={18} color={colors.primaryDark} />
            <ThemedText weight="semibold" color={colors.primaryDark}>
              Cart
            </ThemedText>
          </PressableScale>
        )}
        <View style={styles.bottomBtn}>
          {added ? (
            <Animated.View entering={FadeIn.duration(150)}>
              <Button
                label="Added to cart"
                variant="dark"
                size="lg"
                leftIcon="check"
                fullWidth
                onPress={() => router.push('/cart')}
              />
            </Animated.View>
          ) : (
            <Button
              label={purchasable ? `Add to Cart · ${formatPKR(lineTotal)}` : 'Sold out'}
              variant="gold"
              size="lg"
              leftIcon={purchasable ? 'shopping-bag' : undefined}
              disabled={!purchasable}
              fullWidth
              onPress={handleAdd}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  discountBadge: { position: 'absolute', left: spacing.lg },
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: ms(6),
  },
  dot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(4),
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { backgroundColor: colors.gold[400], width: ms(20) },
  sheet: {
    backgroundColor: colors.bg,
    marginTop: -spacing.xl,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  name: { marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, marginTop: 2 },
  compare: { textDecorationLine: 'line-through' },
  stockChip: { marginTop: spacing.xs },
  description: { marginTop: spacing.sm },
  specCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  specDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  stitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gold[300],
    backgroundColor: colors.gold[50],
  },
  stitchIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold[400],
  },
  stitchBody: { flex: 1, gap: 2 },
  trustRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  viewCart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  bottomBtn: { flex: 1 },
});
