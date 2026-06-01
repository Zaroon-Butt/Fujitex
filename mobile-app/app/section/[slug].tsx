import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ProductGrid } from '@/components/ProductGrid';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useProducts } from '@/features/catalog/useProducts';
import { spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

export default function SectionScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { slug, category, title } = useLocalSearchParams<{
    slug: string;
    category?: string;
    title?: string;
  }>();

  const { data: products = [], isLoading, isRefetching, refetch } = useProducts({
    sectionSlug: slug,
    categorySlug: category,
  });

  const heading = title ?? (category ?? slug ?? 'Catalog').replace(/-/g, ' ');

  return (
    <View style={styles.root}>
      <ScreenHeader showCart />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={styles.titleWrap}>
          <ThemedText variant="overline">Collection</ThemedText>
          <ThemedText variant="display" style={styles.title}>
            {heading}
          </ThemedText>
          {!isLoading && (
            <ThemedText variant="caption" muted>
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </ThemedText>
          )}
        </View>

        {!isLoading && products.length === 0 ? (
          <EmptyState
            icon="package"
            title="Nothing here yet"
            message="No products in this collection right now. Check back soon."
          />
        ) : (
          <ProductGrid products={products} loading={isLoading} skeletonCount={6} />
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  titleWrap: { paddingVertical: spacing.base, gap: 2 },
  title: { textTransform: 'capitalize' },
});
