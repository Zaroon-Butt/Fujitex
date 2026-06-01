import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ProductGrid } from '@/components/ProductGrid';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ThemedText } from '@/components/ui/ThemedText';
import { useProducts } from '@/features/catalog/useProducts';
import { font, fontFamily, fontSize, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import type { ProductWithImages } from '@/types/database';

type Sort = 'relevant' | 'newest' | 'price_asc' | 'price_desc';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'relevant', label: 'Relevant' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
];

function isOnSale(p: ProductWithImages) {
  return p.compare_at_paisas != null && p.compare_at_paisas > p.price_paisas;
}

export default function SearchScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filters?: string; q?: string }>();
  const inputRef = useRef<TextInput>(null);

  const { data: products = [], isLoading } = useProducts();
  const [query, setQuery] = useState(params.q ?? '');
  const [showFilters, setShowFilters] = useState(params.filters === '1');
  const [sort, setSort] = useState<Sort>('relevant');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [fabric, setFabric] = useState<string | null>(null);

  // Distinct fabric types present in the catalog — drives the filter chips.
  const fabricTypes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.fabric_type && set.add(p.fabric_type));
    return Array.from(set).sort();
  }, [products]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (onSaleOnly && !isOnSale(p)) return false;
      if (fabric && p.fabric_type !== fabric) return false;
      if (!q) return true;
      return [p.name, p.fabric_type, p.color, p.occasion, p.fabric_blend]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q));
    });

    switch (sort) {
      case 'newest':
        list = [...list].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case 'price_asc':
        list = [...list].sort((a, b) => a.price_paisas - b.price_paisas);
        break;
      case 'price_desc':
        list = [...list].sort((a, b) => b.price_paisas - a.price_paisas);
        break;
      // 'relevant' keeps the catalog default order
    }
    return list;
  }, [products, query, onSaleOnly, fabric, sort]);

  const activeFilters = (onSaleOnly ? 1 : 0) + (fabric ? 1 : 0) + (sort !== 'relevant' ? 1 : 0);
  const hasQueryOrFilter = query.trim().length > 0 || activeFilters > 0;

  const clearAll = () => {
    setOnSaleOnly(false);
    setFabric(null);
    setSort('relevant');
  };

  return (
    <View style={styles.root}>
      {/* ============ SEARCH HEADER ============ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.searchRow}>
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.backBtn}
            activeScale={0.9}
          >
            <Icon name="chevron-left" size={24} color={colors.text} />
          </PressableScale>

          <View style={styles.searchField}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search fabrics, colours…"
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              style={styles.input}
              autoFocus={params.filters !== '1'}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <PressableScale onPress={() => setQuery('')} hitSlop={10} activeScale={0.85}>
                <Icon name="x" size={18} color={colors.textMuted} />
              </PressableScale>
            )}
          </View>

          <PressableScale
            onPress={() => setShowFilters((v) => !v)}
            style={[styles.filterBtn, (showFilters || activeFilters > 0) && styles.filterBtnActive]}
            activeScale={0.9}
          >
            <Icon name="sliders" size={20} color={showFilters || activeFilters > 0 ? colors.white : colors.text} />
            {activeFilters > 0 && (
              <View style={styles.filterDot}>
                <ThemedText weight="bold" color={colors.ink} style={styles.filterDotText}>
                  {activeFilters}
                </ThemedText>
              </View>
            )}
          </PressableScale>
        </View>

        {/* ============ FILTER PANEL ============ */}
        {showFilters && (
          <Animated.View entering={FadeIn.duration(180)} style={styles.filterPanel}>
            <View style={styles.filterHead}>
              <ThemedText variant="overline">Sort by</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {SORTS.map((so) => {
                const active = sort === so.key;
                return (
                  <PressableScale
                    key={so.key}
                    onPress={() => setSort(so.key)}
                    style={[styles.chip, active && styles.chipActive]}
                    activeScale={0.95}
                  >
                    <ThemedText variant="caption" weight={active ? 'bold' : 'medium'} color={active ? colors.white : colors.text}>
                      {so.label}
                    </ThemedText>
                  </PressableScale>
                );
              })}
              <PressableScale
                onPress={() => setOnSaleOnly((v) => !v)}
                style={[styles.chip, onSaleOnly && styles.chipSale]}
                activeScale={0.95}
              >
                <Icon name="tag" size={12} color={onSaleOnly ? colors.white : colors.rose[600]} />
                <ThemedText variant="caption" weight="bold" color={onSaleOnly ? colors.white : colors.rose[600]}>
                  On Sale
                </ThemedText>
              </PressableScale>
            </ScrollView>

            {fabricTypes.length > 0 && (
              <>
                <View style={styles.filterHead}>
                  <ThemedText variant="overline">Fabric</ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <PressableScale
                    onPress={() => setFabric(null)}
                    style={[styles.chip, fabric === null && styles.chipActive]}
                    activeScale={0.95}
                  >
                    <ThemedText variant="caption" weight={fabric === null ? 'bold' : 'medium'} color={fabric === null ? colors.white : colors.text}>
                      All
                    </ThemedText>
                  </PressableScale>
                  {fabricTypes.map((ft) => {
                    const active = fabric === ft;
                    return (
                      <PressableScale
                        key={ft}
                        onPress={() => setFabric(active ? null : ft)}
                        style={[styles.chip, active && styles.chipActive]}
                        activeScale={0.95}
                      >
                        <ThemedText variant="caption" weight={active ? 'bold' : 'medium'} color={active ? colors.white : colors.text}>
                          {ft}
                        </ThemedText>
                      </PressableScale>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {activeFilters > 0 && (
              <PressableScale onPress={clearAll} style={styles.clearRow} activeScale={0.96}>
                <Icon name="rotate-ccw" size={14} color={colors.primaryDark} />
                <ThemedText variant="caption" weight="semibold" color={colors.primaryDark}>
                  Reset filters
                </ThemedText>
              </PressableScale>
            )}
          </Animated.View>
        )}
      </View>

      {/* ============ RESULTS ============ */}
      <ScrollView
        contentContainerStyle={styles.results}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!isLoading && (
          <ThemedText variant="caption" muted style={styles.count}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
            {query.trim() ? ` for “${query.trim()}”` : ''}
          </ThemedText>
        )}

        {!isLoading && results.length === 0 ? (
          <EmptyState
            icon={hasQueryOrFilter ? 'search' : 'package'}
            title={hasQueryOrFilter ? 'No matches found' : 'Search the catalog'}
            message={
              hasQueryOrFilter
                ? 'Try a different keyword or clear your filters.'
                : 'Start typing to search fabrics by name, colour or occasion.'
            }
            actionLabel={activeFilters > 0 ? 'Reset filters' : undefined}
            onAction={activeFilters > 0 ? clearAll : undefined}
          />
        ) : (
          <ProductGrid products={results} loading={isLoading} skeletonCount={6} />
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: ms(48),
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
  },
  filterBtn: {
    width: ms(48),
    height: ms(48),
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: ms(18),
    height: ms(18),
    paddingHorizontal: ms(4),
    borderRadius: radius.full,
    backgroundColor: colors.gold[400],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  filterDotText: { fontSize: font(10), lineHeight: font(12) },

  filterPanel: { marginTop: spacing.md, gap: spacing.xs },
  filterHead: { marginTop: spacing.xs },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipSale: { backgroundColor: colors.rose[600], borderColor: colors.rose[600] },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },

  results: { paddingHorizontal: spacing.lg, paddingTop: spacing.base, paddingBottom: spacing['3xl'] },
  count: { marginBottom: spacing.md },
});
