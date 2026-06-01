import { StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';
import type { ProductWithImages } from '@/types/database';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductGridProps {
  products: ProductWithImages[];
  loading?: boolean;
  /** Horizontal padding the grid is rendered inside (to compute item width). */
  horizontalPadding?: number;
  gap?: number;
  /** How many skeletons to show while loading. */
  skeletonCount?: number;
  style?: ViewStyle;
}

/**
 * Responsive 2-up (3-up on wide screens / tablets) product grid. Computes exact
 * item widths from the live window width so it adapts to any device and rotation.
 * Presentational only (no own scrolling) — embed inside a ScrollView.
 */
export function ProductGrid({
  products,
  loading = false,
  horizontalPadding = spacing.lg,
  gap = spacing.md,
  skeletonCount = 4,
  style,
}: ProductGridProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const itemWidth = (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  return (
    <View style={[styles.grid, { gap }, style]}>
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <ProductCardSkeleton key={`sk-${i}`} style={{ width: itemWidth }} />
          ))
        : products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} style={{ width: itemWidth }} />
          ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
