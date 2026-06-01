import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation as useRootNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ProductGrid } from '@/components/ProductGrid';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ThemedText } from '@/components/ui/ThemedText';
import { useCartCount } from '@/features/cart/store';
import { useProducts } from '@/features/catalog/useProducts';
import { useNavigation as useSectionsQuery } from '@/features/nav/useNavigation';
import { font, gradients, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import type { ProductWithImages } from '@/types/database';

const CAT_ICONS: IconName[] = ['feather', 'scissors', 'grid', 'star', 'package', 'award', 'gift', 'layers'];

type FilterKey = 'all' | 'new' | 'sale' | 'premium';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New In' },
  { key: 'sale', label: 'On Sale' },
  { key: 'premium', label: 'Premium' },
];

/** Seconds left until end of the local day — drives the flash-sale countdown. */
function useDailyCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const left = Math.max(0, Math.floor((end - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    h: pad(Math.floor(left / 3600)),
    m: pad(Math.floor((left % 3600) / 60)),
    s: pad(left % 60),
  };
}

export default function HomeScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  // Reach the parent Drawer navigator (this screen lives in the tabs child).
  const drawerNav = useRootNavigation('/(drawer)');
  const cartCount = useCartCount();
  const { data: sections = [], isLoading: navLoading, error: navError } = useSectionsQuery();
  const { data: products = [], isLoading: prodLoading } = useProducts();
  const [filter, setFilter] = useState<FilterKey>('all');
  const { h, m, s } = useDailyCountdown();

  const openDrawer = () => (drawerNav as unknown as { openDrawer: () => void }).openDrawer();

  const categories = sections.flatMap((sec) =>
    sec.categories.map((c) => ({ section: sec, category: c })),
  );
  const firstSection = sections[0];

  const filtered = useMemo<ProductWithImages[]>(() => {
    const list = [...products];
    switch (filter) {
      case 'sale':
        return list
          .filter((p) => p.compare_at_paisas != null && p.compare_at_paisas > p.price_paisas)
          .sort(
            (a, b) =>
              (b.compare_at_paisas! - b.price_paisas) / b.compare_at_paisas! -
              (a.compare_at_paisas! - a.price_paisas) / a.compare_at_paisas!,
          );
      case 'premium':
        return list.sort((a, b) => b.price_paisas - a.price_paisas);
      case 'new':
        return list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      default:
        return list;
    }
  }, [products, filter]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ TOP BAR ============ */}
        <View style={styles.topBar}>
          <PressableScale onPress={openDrawer} style={styles.iconBtn} activeScale={0.9}>
            <Icon name="menu" size={22} color={colors.text} />
          </PressableScale>

          <PressableScale style={styles.location} activeScale={0.96} onPress={openDrawer}>
            <ThemedText variant="caption" muted style={styles.locationLabel}>
              Deliver to
            </ThemedText>
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={13} color={colors.primaryDark} />
              <ThemedText variant="label" weight="bold">
                Lahore, Pakistan
              </ThemedText>
              <Icon name="chevron-down" size={14} color={colors.text} />
            </View>
          </PressableScale>

          <PressableScale onPress={() => router.push('/cart')} style={styles.iconBtn} activeScale={0.9}>
            <Icon name="shopping-bag" size={20} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <ThemedText weight="bold" color={colors.ink} style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </ThemedText>
              </View>
            )}
          </PressableScale>
        </View>

        {/* ============ SEARCH ============ */}
        <View style={styles.searchRow}>
          <PressableScale style={styles.search} activeScale={0.98} onPress={() => router.push('/search')}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <ThemedText variant="body" color={colors.textSubtle} style={styles.flex}>
              Search fabrics, colours…
            </ThemedText>
          </PressableScale>
          <PressableScale style={styles.filterBtn} activeScale={0.92} onPress={() => router.push('/search?filters=1')}>
            <Icon name="sliders" size={20} color={colors.white} />
          </PressableScale>
        </View>

        {/* ============ PROMO BANNER ============ */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.bannerWrap}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerGlow} />
            <View style={styles.bannerText}>
              <View style={styles.bannerBadge}>
                <ThemedText weight="bold" color={colors.gold[200]} style={styles.bannerBadgeText}>
                  NEW COLLECTION
                </ThemedText>
              </View>
              <ThemedText variant="h1" color={colors.white} style={styles.bannerTitle}>
                Up to 50% off{'\n'}your first order
              </ThemedText>
              <PressableScale
                style={styles.shopNow}
                activeScale={0.95}
                onPress={() =>
                  firstSection
                    ? router.push(`/section/${firstSection.slug}?title=${encodeURIComponent(firstSection.name)}`)
                    : router.push('/shop')
                }
              >
                <ThemedText variant="label" weight="bold" color={colors.ink}>
                  Shop Now
                </ThemedText>
                <Icon name="arrow-right" size={15} color={colors.ink} />
              </PressableScale>
            </View>
            {products[0]?.product_images?.[0]?.url && (
              <Image
                source={products[0].product_images.find((i) => i.is_primary)?.url ?? products[0].product_images[0].url}
                style={styles.bannerImg}
                contentFit="cover"
                transition={250}
              />
            )}
          </LinearGradient>
        </Animated.View>

        {/* ============ CATEGORIES ============ */}
        <View style={styles.sectionHead}>
          <ThemedText variant="h3">Categories</ThemedText>
          <PressableScale activeScale={0.95} onPress={() => router.push('/shop')}>
            <ThemedText variant="label" weight="semibold" color={colors.primaryDark}>
              See all
            </ThemedText>
          </PressableScale>
        </View>

        {navError ? (
          <View style={styles.padded}>
            <EmptyState
              tone="error"
              icon="wifi-off"
              title="Couldn't load categories"
              message="Check your connection and that Supabase env vars are set, then pull to retry."
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {(navLoading ? Array.from({ length: 5 }) : categories).map((entry, i) =>
              navLoading ? (
                <View key={`cs-${i}`} style={styles.catItem}>
                  <View style={[styles.catCircle, styles.catSkeleton]} />
                </View>
              ) : (
                <CategoryCircle
                  key={(entry as (typeof categories)[number]).category.id}
                  index={i}
                  entry={entry as (typeof categories)[number]}
                />
              ),
            )}
          </ScrollView>
        )}

        {/* ============ FLASH SALE ============ */}
        <View style={styles.sectionHead}>
          <ThemedText variant="h3">Flash Sale</ThemedText>
          <View style={styles.countdown}>
            <Icon name="clock" size={13} color={colors.primaryDark} />
            <ThemedText variant="caption" muted>
              Ends in
            </ThemedText>
            {[h, m, s].map((part, i) => (
              <View key={i} style={styles.timeRow}>
                {i > 0 && <ThemedText style={styles.colon}>:</ThemedText>}
                <View style={styles.timeBox}>
                  <ThemedText weight="bold" color={colors.white} style={styles.timeText}>
                    {part}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <PressableScale
                key={f.key}
                activeScale={0.95}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <ThemedText
                  variant="label"
                  weight={active ? 'bold' : 'medium'}
                  color={active ? colors.white : colors.text}
                >
                  {f.label}
                </ThemedText>
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={styles.padded}>
          {!prodLoading && filtered.length === 0 ? (
            <EmptyState
              icon="package"
              title={filter === 'sale' ? 'No deals right now' : 'No products yet'}
              message={
                filter === 'sale'
                  ? 'Check back soon for fresh discounts.'
                  : 'Apply the Supabase seed migration to populate the catalog.'
              }
            />
          ) : (
            <ProductGrid products={filtered.slice(0, 10)} loading={prodLoading} skeletonCount={4} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryCircle({
  entry,
  index,
}: {
  entry: { section: { slug: string; name: string }; category: { id: string; slug: string; name: string; image_url: string | null } };
  index: number;
}) {
  const { section, category } = entry;
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(380)}>
      <PressableScale
        style={styles.catItem}
        activeScale={0.94}
        onPress={() =>
          router.push(
            `/section/${section.slug}?category=${category.slug}&title=${encodeURIComponent(category.name)}`,
          )
        }
      >
        <View style={styles.catCircle}>
          {category.image_url ? (
            <Image source={category.image_url} style={styles.catImg} contentFit="cover" transition={150} />
          ) : (
            <Icon name={CAT_ICONS[index % CAT_ICONS.length]} size={24} color={colors.primaryDark} />
          )}
        </View>
        <ThemedText variant="caption" weight="medium" numberOfLines={1} style={styles.catName}>
          {category.name}
        </ThemedText>
      </PressableScale>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  location: { flex: 1, alignItems: 'center' },
  locationLabel: { fontSize: font(11) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: ms(16),
    height: ms(16),
    paddingHorizontal: ms(3),
    borderRadius: radius.full,
    backgroundColor: colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: { fontSize: font(9), lineHeight: font(11) },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: ms(52),
    ...shadows.sm,
  },
  filterBtn: {
    width: ms(52),
    height: ms(52),
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.brand,
  },

  // Banner
  bannerWrap: { paddingHorizontal: spacing.lg },
  banner: {
    flexDirection: 'row',
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    minHeight: ms(168),
    overflow: 'hidden',
    alignItems: 'center',
  },
  bannerGlow: {
    position: 'absolute',
    top: -70,
    right: 40,
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: 'rgba(245,158,11,0.22)',
  },
  bannerText: { flex: 1, gap: spacing.sm, zIndex: 2 },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(252,211,77,0.34)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  bannerBadgeText: { fontSize: font(10), letterSpacing: 1.5 },
  bannerTitle: { marginTop: 2 },
  shopNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[400],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    ...shadows.gold,
  },
  bannerImg: {
    width: ms(118),
    height: ms(148),
    borderRadius: radius.xl,
    marginLeft: spacing.sm,
  },

  // Section headers
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  // Categories
  catScroll: { paddingHorizontal: spacing.lg, gap: spacing.base },
  catItem: { alignItems: 'center', width: ms(76), gap: spacing.xs },
  catCircle: {
    width: ms(66),
    height: ms(66),
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  catSkeleton: { backgroundColor: colors.neutral[200] },
  catImg: { width: '100%', height: '100%' },
  catName: { textAlign: 'center', maxWidth: ms(74) },

  // Flash sale countdown
  countdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeBox: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.sm,
    paddingHorizontal: ms(6),
    paddingVertical: ms(3),
    minWidth: ms(24),
    alignItems: 'center',
  },
  timeText: { fontSize: font(12) },
  colon: { color: colors.primaryDark, marginHorizontal: 2, fontFamily: 'Inter_700Bold' },

  // Chips
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.base },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
