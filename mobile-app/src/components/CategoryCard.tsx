import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { font, gradients, ms, radius, shadows, spacing } from '@/theme';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

const PALETTES = [gradients.card, gradients.gold, gradients.rose, gradients.brand] as const;

interface CategoryCardProps {
  sectionSlug: string;
  sectionName: string;
  categorySlug: string;
  categoryName: string;
  index?: number;
  style?: ViewStyle;
}

export function CategoryCard({
  sectionSlug,
  sectionName,
  categorySlug,
  categoryName,
  index = 0,
  style,
}: CategoryCardProps) {
  const palette = PALETTES[index % PALETTES.length];

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 60)
        .duration(420)
        .springify()
        .damping(16)}
      style={style}
    >
      <PressableScale
        activeScale={0.97}
        onPress={() =>
          router.push(
            `/section/${sectionSlug}?category=${categorySlug}&title=${encodeURIComponent(categoryName)}`,
          )
        }
        style={styles.card}
      >
        <LinearGradient
          colors={palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Decorative blobs, echoing the web tiles */}
          <View style={styles.blobBR} />
          <View style={styles.blobTL} />

          <View style={styles.content}>
            <ThemedText variant="overline" color="rgba(255,255,255,0.85)" numberOfLines={1}>
              {sectionName}
            </ThemedText>
            <View>
              <ThemedText variant="h2" color="#fff" numberOfLines={2}>
                {categoryName}
              </ThemedText>
              <View style={styles.cta}>
                <ThemedText weight="semibold" color="rgba(255,255,255,0.95)" style={styles.ctaText}>
                  Shop now
                </ThemedText>
                <Icon name="arrow-right" size={15} color="rgba(255,255,255,0.95)" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    ...shadows.md,
  },
  gradient: {
    aspectRatio: 4 / 5,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  content: { flex: 1, justifyContent: 'space-between' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ctaText: { fontSize: font(13) },
  blobBR: {
    position: 'absolute',
    bottom: -48,
    right: -48,
    width: ms(150),
    height: ms(150),
    borderRadius: ms(75),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blobTL: {
    position: 'absolute',
    top: -32,
    left: -32,
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});
