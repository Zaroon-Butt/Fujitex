import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ThemedText } from '@/components/ui/ThemedText';
import { paymentProviders } from '@/features/payments/providers';
import { formatPKR } from '@/lib/format';
import { gradients, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import type { PaymentMethod } from '@/types/database';

export default function OrderConfirmationScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { order, total, method } = useLocalSearchParams<{
    order: string;
    total: string;
    method: PaymentMethod;
  }>();

  const provider = method ? paymentProviders[method] : undefined;
  const totalPaisas = Number(total) || 0;

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <View style={styles.glowGold} />
        <Animated.View entering={ZoomIn.duration(450).springify()} style={styles.checkCircle}>
          <Icon name="check" size={46} color={colors.brand[700]} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.heroText}>
          <ThemedText variant="overline" color={colors.gold[300]}>
            Order placed
          </ThemedText>
          <ThemedText variant="display" color={colors.white} align="center" style={styles.thanks}>
            Thank you!
          </ThemedText>
          <ThemedText variant="bodyLg" color="rgba(255,255,255,0.85)" align="center">
            Your order is confirmed. We'll be in touch shortly.
          </ThemedText>
        </Animated.View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.card}>
        <Row label="Order number" value={order ?? '—'} />
        <Divider />
        <Row label="Total" value={formatPKR(totalPaisas)} emphasize />
        {provider && (
          <>
            <Divider />
            <Row label="Payment" value={provider.label} />
          </>
        )}
        {provider?.method === 'cod' && (
          <View style={styles.note}>
            <Icon name="info" size={16} color={colors.gold[700]} />
            <ThemedText variant="caption" color={colors.gold[800]} style={styles.noteText}>
              Please keep the exact cash amount ready for delivery.
            </ThemedText>
          </View>
        )}
      </Animated.View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label="Continue Shopping"
          variant="gold"
          size="lg"
          fullWidth
          leftIcon="shopping-bag"
          onPress={() => router.replace('/')}
        />
        <Button
          label="View my orders"
          variant="outline"
          size="lg"
          fullWidth
          onPress={() => router.replace('/account')}
        />
      </View>
    </View>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <ThemedText variant="body" muted>
        {label}
      </ThemedText>
      <ThemedText
        variant={emphasize ? 'h3' : 'label'}
        weight="bold"
        color={emphasize ? colors.primaryDark : colors.text}
      >
        {value}
      </ThemedText>
    </View>
  );
}

function Divider() {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.divider} />;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: radius['3xl'],
    borderBottomRightRadius: radius['3xl'],
    overflow: 'hidden',
  },
  glowGold: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: ms(260),
    height: ms(260),
    borderRadius: ms(130),
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  checkCircle: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  heroText: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  thanks: { marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -spacing['2xl'],
    borderRadius: radius['2xl'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.gold[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: { flex: 1 },
  actions: { padding: spacing.lg, gap: spacing.md, marginTop: 'auto' },
});
