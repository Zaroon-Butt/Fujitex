import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { env } from '@/lib/env';
import { gradients, colors, fontFamily, fontSize, letterSpacing, ms } from '@/theme';
import { Icon } from './ui/Icon';

/**
 * Branded animated splash, shown over the app on cold start:
 *   wordmark fades + scales in → gold rule expands → tagline fades in →
 *   the whole layer fades out and reveals the storefront.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoTranslate = useSharedValue(18);
  const logoScale = useSharedValue(0.9);
  const ruleWidth = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    badgeScale.value = withDelay(80, withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.6)) }));
    logoOpacity.value = withDelay(220, withTiming(1, { duration: 520 }));
    logoTranslate.value = withDelay(220, withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(220, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
    ruleWidth.value = withDelay(640, withTiming(ms(96), { duration: 520, easing: Easing.out(Easing.cubic) }));
    taglineOpacity.value = withDelay(860, withTiming(1, { duration: 480 }));

    // Hold, then fade the whole splash out and hand control to the app.
    containerOpacity.value = withDelay(
      1750,
      withSequence(
        withTiming(1, { duration: 1 }),
        withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onFinish)();
        }),
      ),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslate.value }, { scale: logoScale.value }],
  }));
  const ruleStyle = useAnimatedStyle(() => ({ width: ruleWidth.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeScale.value, transform: [{ scale: badgeScale.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, containerStyle]}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
      {/* decorative gold + rose glows */}
      <View style={styles.glowGold} />
      <View style={styles.glowRose} />

      <View style={styles.center}>
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Icon name="feather" size={26} color={colors.gold[300]} />
        </Animated.View>

        <Animated.Text style={[styles.wordmark, logoStyle]}>{env.STORE_NAME}</Animated.Text>

        <Animated.View style={[styles.rule, ruleStyle]} />

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          PREMIUM FABRIC · LAHORE
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' },
  glowGold: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: ms(300),
    height: ms(300),
    borderRadius: ms(150),
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  glowRose: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: ms(320),
    height: ms(320),
    borderRadius: ms(160),
    backgroundColor: 'rgba(190,24,93,0.16)',
  },
  center: { alignItems: 'center' },
  badge: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.3)',
    marginBottom: ms(22),
  },
  wordmark: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['6xl'],
    color: colors.white,
    letterSpacing: 0.5,
  },
  rule: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold[400],
    marginTop: 14,
  },
  tagline: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: 'rgba(253,230,138,0.9)',
    letterSpacing: letterSpacing.widest,
    marginTop: 16,
  },
});
