import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Layout, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  useCartActions,
  useCartHydrated,
  useCartItems,
  useCartStitchingTotal,
  useCartSubtotal,
  type CartItem,
} from '@/features/cart/store';
import { kameezMeasurements, shalwarMeasurements } from '@/features/stitching/measurements';
import { formatPKR } from '@/lib/format';
import { font, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

const BLUR = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

/** Short, human summary of a stitched line's measurements (first few fields). */
function stitchingSummary(item: CartItem): string {
  if (!item.stitching) return '';
  const parts = [...kameezMeasurements, ...shalwarMeasurements]
    .map((f) => {
      const v = item.stitching!.values[f.key as keyof typeof item.stitching.values];
      return v === undefined ? null : `${f.label.split(' ')[0]} ${v}`;
    })
    .filter(Boolean)
    .slice(0, 3);
  return `${parts.join(' · ')} (${item.stitching.unit})`;
}

function CartLine({ item }: { item: CartItem }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { setQty, remove } = useCartActions();
  return (
    <Animated.View layout={Layout.springify()} exiting={SlideOutLeft.duration(220)} style={styles.line}>
      <PressableScale onPress={() => router.push(`/product/${item.slug}`)} activeScale={0.97}>
        <Image
          source={item.imageUrl}
          placeholder={{ blurhash: BLUR }}
          contentFit="cover"
          transition={200}
          style={styles.thumb}
        />
      </PressableScale>

      <View style={styles.lineBody}>
        {!!item.fabricType && <ThemedText variant="overline" numberOfLines={1}>{item.fabricType}</ThemedText>}
        <ThemedText variant="label" weight="semibold" numberOfLines={2}>
          {item.name}
        </ThemedText>
        <ThemedText variant="price" style={styles.linePrice}>
          {formatPKR(item.pricePaisas)}
        </ThemedText>

        {item.stitching && (
          <View style={styles.stitchBadge}>
            <Icon name="scissors" size={12} color={colors.primaryDark} />
            <ThemedText variant="caption" color={colors.primaryDark} weight="semibold">
              Stitched · +{formatPKR(item.stitching.feePaisas)}
            </ThemedText>
          </View>
        )}
        {item.stitching && (
          <ThemedText variant="caption" muted numberOfLines={1}>
            {stitchingSummary(item)}
          </ThemedText>
        )}

        <View style={styles.lineControls}>
          <QuantityStepper
            value={item.quantity}
            onChange={(n) => setQty(item.lineId, n)}
            min={1}
            max={item.maxStock}
            size="sm"
          />
          <PressableScale onPress={() => remove(item.lineId)} style={styles.remove} activeScale={0.9}>
            <Icon name="trash-2" size={16} color={colors.neutral[500]} />
          </PressableScale>
        </View>
      </View>

      <ThemedText variant="label" weight="bold" style={styles.lineTotal}>
        {formatPKR((item.pricePaisas + (item.stitching?.feePaisas ?? 0)) * item.quantity)}
      </ThemedText>
    </Animated.View>
  );
}

export default function CartScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const stitching = useCartStitchingTotal();
  const hydrated = useCartHydrated();
  const { clear } = useCartActions();

  const isEmpty = hydrated && items.length === 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View>
          <ThemedText variant="overline">Your bag</ThemedText>
          <ThemedText variant="h1">Cart</ThemedText>
        </View>
        {items.length > 0 && (
          <PressableScale onPress={clear} style={styles.clearBtn} activeScale={0.94}>
            <ThemedText variant="caption" color={colors.danger} weight="semibold">
              Clear all
            </ThemedText>
          </PressableScale>
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          message="Browse our premium fabrics and add your favourites."
          actionLabel="Start shopping"
          onAction={() => router.push('/shop')}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <CartLine key={item.lineId} item={item} />
            ))}
          </ScrollView>

          {/* Summary + checkout */}
          {/* Cart is a tab screen, so the tab bar already covers the bottom
              inset — only normal padding is needed here. */}
          <Animated.View entering={FadeIn} style={[styles.summary, styles.summaryPad]}>
            <View style={styles.summaryRow}>
              <ThemedText variant="body" muted>
                Subtotal
              </ThemedText>
              <ThemedText variant="label" weight="semibold">{formatPKR(subtotal)}</ThemedText>
            </View>
            {stitching > 0 && (
              <View style={[styles.summaryRow, styles.summaryRowGap]}>
                <ThemedText variant="body" muted>
                  Stitching
                </ThemedText>
                <ThemedText variant="label" weight="semibold">{formatPKR(stitching)}</ThemedText>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowGap]}>
              <ThemedText variant="title">Total</ThemedText>
              <ThemedText variant="title" color={colors.primaryDark}>
                {formatPKR(subtotal + stitching)}
              </ThemedText>
            </View>
            <ThemedText variant="caption" muted style={styles.shipNote}>
              Shipping calculated at checkout.
            </ThemedText>
            <Button
              label="Proceed to Checkout"
              variant="gold"
              size="lg"
              rightIcon="arrow-right"
              fullWidth
              onPress={() => router.push('/checkout')}
              style={styles.checkoutBtn}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  clearBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  line: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  thumb: { width: ms(76), height: ms(100), borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  lineBody: { flex: 1, gap: 2 },
  linePrice: { fontSize: font(14), marginTop: 2 },
  stitchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  lineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  remove: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  lineTotal: { alignSelf: 'flex-start' },
  summary: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    ...shadows.lg,
  },
  summaryPad: { paddingBottom: spacing.base },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryRowGap: { marginTop: spacing.xs },
  shipNote: { marginTop: 2 },
  checkoutBtn: { marginTop: spacing.base },
});
