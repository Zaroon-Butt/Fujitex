import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemedText } from '@/components/ui/ThemedText';
import { useMyOrders } from '@/features/account/useMyOrders';
import { useAuthActions, useAuthLoading, useProfile, useUser } from '@/features/auth/store';
import { env } from '@/lib/env';
import { formatPKR } from '@/lib/format';
import {
  gradients,
  ms,
  radius,
  shadows,
  spacing,
  useColors,
  useIsDark,
  useThemeActions,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

const PERKS: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'truck', title: 'Track every order', sub: 'Live status from Lahore to your door' },
  { icon: 'heart', title: 'Save your favourites', sub: 'Build a wishlist of fabrics you love' },
  { icon: 'zap', title: 'Faster checkout', sub: 'Saved address & details, one tap to pay' },
];

type MenuItem = { icon: IconName; label: string; sub?: string; onPress: () => void; danger?: boolean };

export default function AccountScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const user = useUser();
  const profile = useProfile();
  const loading = useAuthLoading();
  const { signOut } = useAuthActions();
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders(user?.id);

  const supportItems: MenuItem[] = [
    { icon: 'map-pin', label: 'Visit our outlet', sub: 'Lahore showroom', onPress: () => Linking.openURL(env.STORE_OUTLET_URL) },
    { icon: 'truck', label: 'Shipping & delivery', sub: 'Rates, zones & timelines', onPress: () => router.push('/shop') },
    { icon: 'help-circle', label: 'Help & support', sub: 'Returns, payments, FAQs', onPress: () => Linking.openURL(env.STORE_OUTLET_URL) },
    { icon: 'shield', label: 'Privacy & terms', onPress: () => Linking.openURL(env.STORE_OUTLET_URL) },
  ];

  /* ============================ LOGGED OUT ============================ */
  if (!loading && !user) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing['4xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pad}>
          <ThemedText variant="overline">My account</ThemedText>
          <ThemedText variant="display" style={styles.screenTitle}>
            Account
          </ThemedText>
        </View>

        {/* Auth hero */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.pad}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.authHero}>
            <View style={styles.glowGold} />
            <View style={styles.authHeroRow}>
              <View style={styles.avatarLg}>
                <Icon name="user" size={28} color={colors.white} />
              </View>
              <View style={styles.flex}>
                <ThemedText variant="h2" color={colors.white}>
                  Welcome to {env.STORE_NAME}
                </ThemedText>
                <ThemedText variant="caption" color="rgba(255,255,255,0.8)">
                  Sign in or create an account to get started.
                </ThemedText>
              </View>
            </View>
            <View style={styles.authBtns}>
              <Button label="Sign In" variant="gold" size="lg" fullWidth rightIcon="arrow-right" onPress={() => router.push('/sign-in')} />
              <Button label="Create Account" variant="light" size="lg" fullWidth onPress={() => router.push('/sign-up')} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Perks */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={[styles.pad, styles.gapTop]}>
          <ThemedText variant="h3" style={styles.blockTitle}>
            Why create an account?
          </ThemedText>
          <View style={styles.card}>
            {PERKS.map((p, i) => (
              <View key={p.title}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.perkRow}>
                  <View style={styles.perkIcon}>
                    <Icon name={p.icon} size={18} color={colors.primaryDark} />
                  </View>
                  <View style={styles.flex}>
                    <ThemedText variant="label" weight="bold">
                      {p.title}
                    </ThemedText>
                    <ThemedText variant="caption" muted>
                      {p.sub}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Support / more */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)} style={[styles.pad, styles.gapTop]}>
          <ThemedText variant="h3" style={styles.blockTitle}>
            Support & info
          </ThemedText>
          <MenuList items={supportItems} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(450)} style={[styles.pad, styles.gapTop]}>
          <ThemedText variant="h3" style={styles.blockTitle}>
            Preferences
          </ThemedText>
          <AppearanceCard />
        </Animated.View>

        <Footer />
      </ScrollView>
    );
  }

  /* ============================ LOGGED IN ============================ */
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Welcome';
  const accountItems: MenuItem[] = [
    { icon: 'edit-2', label: 'Edit profile', sub: 'Name, phone & photo', onPress: () => router.push('/edit-profile') },
    { icon: 'shopping-bag', label: 'My cart', onPress: () => router.push('/cart') },
    { icon: 'grid', label: 'Shop catalog', onPress: () => router.push('/shop') },
    ...supportItems,
    { icon: 'log-out', label: 'Sign out', onPress: signOut, danger: true },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing['4xl'] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.pad}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
          <View style={styles.glowGold} />
          <View style={styles.profileRow}>
            <PressableScale activeScale={0.95} onPress={() => router.push('/edit-profile')} style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={profile.avatar_url} style={styles.avatarImg} contentFit="cover" transition={150} />
              ) : (
                <ThemedText variant="h2" color={colors.white}>
                  {displayName.slice(0, 1).toUpperCase()}
                </ThemedText>
              )}
            </PressableScale>
            <View style={styles.flex}>
              <ThemedText variant="overline" color={colors.gold[300]}>
                My account
              </ThemedText>
              <ThemedText variant="h2" color={colors.white} numberOfLines={1}>
                {displayName}
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                {user?.email}
              </ThemedText>
            </View>
          </View>

          {/* Inline stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText variant="h3" color={colors.white}>
                {ordersLoading ? '—' : orders.length}
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.75)">
                Orders
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <ThemedText variant="h3" color={colors.white}>
                {profile?.phone ? '✓' : '—'}
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.75)">
                Phone
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <ThemedText variant="h3" color={colors.gold[300]}>
                COD
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.75)">
                Available
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Orders */}
      <Animated.View entering={FadeInDown.delay(80).duration(450)} style={[styles.pad, styles.gapTop]}>
        <View style={styles.ordersHeader}>
          <ThemedText variant="h3">Recent orders</ThemedText>
          {orders.length > 0 && (
            <PressableScale activeScale={0.95} onPress={() => router.push('/shop')}>
              <ThemedText variant="label" weight="semibold" color={colors.primaryDark}>
                Shop more
              </ThemedText>
            </PressableScale>
          )}
        </View>

        {ordersLoading ? (
          <View style={styles.gap}>
            <Skeleton height={76} borderRadius={radius.lg} />
            <Skeleton height={76} borderRadius={radius.lg} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <View style={styles.emptyIcon}>
              <Icon name="package" size={26} color={colors.primary} />
            </View>
            <ThemedText variant="title" align="center">
              No orders yet
            </ThemedText>
            <ThemedText variant="caption" muted align="center" style={styles.emptyMsg}>
              When you place an order it'll show up here for easy tracking.
            </ThemedText>
            <Button label="Start shopping" variant="primary" rightIcon="arrow-right" onPress={() => router.push('/shop')} style={styles.emptyBtn} />
          </View>
        ) : (
          <View style={styles.gap}>
            {orders.map((o) => (
              <PressableScale key={o.id} activeScale={0.98} style={styles.orderCard}>
                <View style={styles.orderIcon}>
                  <Icon name="package" size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.flex}>
                  <ThemedText variant="label" weight="bold">
                    {o.order_number}
                  </ThemedText>
                  <ThemedText variant="caption" muted>
                    {new Date(o.placed_at).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' · '}
                    {o.ship_city}
                  </ThemedText>
                  <View style={styles.orderChips}>
                    <Chip label={o.status} tone="brand" />
                    <Chip label={o.payment_method.toUpperCase()} tone="gold" />
                  </View>
                </View>
                <ThemedText variant="title" color={colors.primaryDark}>
                  {formatPKR(o.total_paisas)}
                </ThemedText>
              </PressableScale>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Account menu */}
      <Animated.View entering={FadeInDown.delay(160).duration(450)} style={[styles.pad, styles.gapTop]}>
        <ThemedText variant="h3" style={styles.blockTitle}>
          Account
        </ThemedText>
        <MenuList items={accountItems} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(450)} style={[styles.pad, styles.gapTop]}>
        <ThemedText variant="h3" style={styles.blockTitle}>
          Preferences
        </ThemedText>
        <AppearanceCard />
      </Animated.View>

      <Footer />
    </ScrollView>
  );
}

/* ------------------------------ shared bits ------------------------------ */

/** Dark-mode toggle row. Reads/writes the persisted theme store. */
function AppearanceCard() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const isDark = useIsDark();
  const { toggle } = useThemeActions();

  return (
    <View style={styles.card}>
      <View style={styles.menuRow}>
        <View style={styles.menuIcon}>
          <Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.primaryDark} />
        </View>
        <View style={styles.flex}>
          <ThemedText variant="label" weight="semibold">
            Dark mode
          </ThemedText>
          <ThemedText variant="caption" muted>
            {isDark ? 'On — easier on the eyes at night' : 'Off — following a light theme'}
          </ThemedText>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggle}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.borderStrong}
        />
      </View>
    </View>
  );
}

function MenuList({ items }: { items: MenuItem[] }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      {items.map((item, i) => (
        <View key={item.label}>
          {i > 0 && <View style={styles.divider} />}
          <PressableScale style={styles.menuRow} activeScale={0.98} onPress={item.onPress}>
            <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
              <Icon name={item.icon} size={18} color={item.danger ? colors.danger : colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <ThemedText variant="label" weight="semibold" color={item.danger ? colors.danger : colors.text}>
                {item.label}
              </ThemedText>
              {!!item.sub && (
                <ThemedText variant="caption" muted>
                  {item.sub}
                </ThemedText>
              )}
            </View>
            {!item.danger && <Icon name="chevron-right" size={18} color={colors.textSubtle} />}
          </PressableScale>
        </View>
      ))}
    </View>
  );
}

function Footer() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.footer}>
      <View style={styles.footerBrand}>
        <Icon name="feather" size={14} color={colors.primaryDark} />
        <ThemedText variant="caption" weight="semibold" color={colors.primaryDark}>
          {env.STORE_NAME}
        </ThemedText>
      </View>
      <ThemedText variant="caption" muted>
        Premium fabric · Crafted in Lahore
      </ThemedText>
      <ThemedText variant="caption" color={colors.textSubtle} style={styles.version}>
        Version 1.0.0
      </ThemedText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  gap: { gap: spacing.md },
  pad: { paddingHorizontal: spacing.lg },
  gapTop: { marginTop: spacing.xl },
  screenTitle: { marginTop: 2 },
  blockTitle: { marginBottom: spacing.md },

  // Shared gradient glow
  glowGold: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: ms(190),
    height: ms(190),
    borderRadius: ms(95),
    backgroundColor: 'rgba(245,158,11,0.2)',
  },

  // Logged-out hero
  authHero: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.lg,
    marginTop: spacing.base,
    ...shadows.brand,
  },
  authHeroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarLg: {
    width: ms(56),
    height: ms(56),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtns: { gap: spacing.sm },

  // Logged-in profile card
  profileCard: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.lg,
    marginTop: spacing.base,
    ...shadows.brand,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: ms(60),
    height: ms(60),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: ms(28), backgroundColor: 'rgba(255,255,255,0.25)' },

  // Cards & rows
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    ...shadows.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: ms(52) },

  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.base },
  perkIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.base },
  menuIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: colors.dangerSoft },

  // Orders
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.base,
    ...shadows.sm,
  },
  orderIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderChips: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  emptyOrders: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  emptyIcon: {
    width: ms(60),
    height: ms(60),
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyMsg: { maxWidth: ms(280) },
  emptyBtn: { marginTop: spacing.sm, alignSelf: 'center' },

  // Footer
  footer: { alignItems: 'center', gap: 4, marginTop: spacing['2xl'] },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  version: { marginTop: 2 },
});
