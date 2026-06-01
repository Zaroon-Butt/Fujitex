import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryCard } from '@/components/CategoryCard';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ThemedText } from '@/components/ui/ThemedText';
import { useNavigation } from '@/features/nav/useNavigation';
import { radius, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

export default function ShopScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: sections = [], isLoading, error } = useNavigation();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + spacing.base, paddingBottom: spacing['3xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText variant="overline">Browse the catalog</ThemedText>
        <ThemedText variant="display">Shop</ThemedText>
      </View>

      {error ? (
        <EmptyState
          tone="error"
          icon="wifi-off"
          title="Couldn't load the catalog"
          message="Check your connection and Supabase configuration, then try again."
        />
      ) : isLoading ? (
        <View style={[styles.grid, styles.gridPadded]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.id} style={styles.sectionBlock}>
            <PressableScale
              style={styles.sectionRow}
              activeScale={0.97}
              onPress={() =>
                router.push(`/section/${section.slug}?title=${encodeURIComponent(section.name)}`)
              }
            >
              <View style={styles.sectionTitleWrap}>
                <ThemedText variant="h2">{section.name}</ThemedText>
                {!!section.description && (
                  <ThemedText variant="caption" muted numberOfLines={2}>
                    {section.description}
                  </ThemedText>
                )}
              </View>
              <Icon name="arrow-right" size={20} color={colors.primaryDark} />
            </PressableScale>

            <View style={styles.grid}>
              {section.categories.map((c, i) => (
                <CategoryCard
                  key={c.id}
                  index={i}
                  sectionSlug={section.slug}
                  sectionName={section.name}
                  categorySlug={c.slug}
                  categoryName={c.name}
                  style={styles.gridItem}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.base, gap: 2 },
  sectionBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitleWrap: { flex: 1, gap: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridPadded: { paddingHorizontal: spacing.lg },
  gridItem: { width: '47.8%' },
  skeleton: {
    width: '47.8%',
    aspectRatio: 4 / 5,
    borderRadius: radius['2xl'],
    backgroundColor: colors.neutral[200],
  },
});
