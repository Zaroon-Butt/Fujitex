import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/theme';
import { Skeleton } from './ui/Skeleton';

/** Loading placeholder matching the ProductCard footprint. */
export function ProductCardSkeleton({ style }: { style?: ViewStyle }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={undefined} borderRadius={0} style={styles.image} />
      <View style={styles.meta}>
        <Skeleton width="40%" height={10} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
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
  },
  image: { width: '100%', aspectRatio: 3 / 4 },
  meta: { padding: spacing.md, gap: spacing.sm },
});
