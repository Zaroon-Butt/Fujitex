import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthActions, useProfile, useUser } from '@/features/auth/store';
import { useNavigation } from '@/features/nav/useNavigation';
import { env } from '@/lib/env';
import { gradients, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon, type IconName } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

const QUICK: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'home', label: 'Home', href: '/' },
  { icon: 'grid', label: 'Shop', href: '/shop' },
  { icon: 'shopping-bag', label: 'Cart', href: '/cart' },
  { icon: 'user', label: 'Account', href: '/account' },
];

export function CategoryDrawer({ navigation }: DrawerContentComponentProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: sections = [], isLoading, error } = useNavigation();
  const user = useUser();
  const profile = useProfile();
  const { signOut } = useAuthActions();

  const close = () => navigation.closeDrawer();
  const go = (href: Href) => {
    close();
    router.push(href);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || null;

  return (
    <View style={styles.root}>
      {/* Brand / profile header */}
      <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.glow} />
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Icon name="feather" size={18} color={colors.gold[300]} />
            </View>
            <View>
              <ThemedText variant="h3" color={colors.white}>
                {env.STORE_NAME}
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.7)">
                Premium fabric · Lahore
              </ThemedText>
            </View>
          </View>
          <PressableScale onPress={close} style={styles.closeBtn} activeScale={0.9}>
            <Icon name="x" size={20} color={colors.white} />
          </PressableScale>
        </View>

        {user ? (
          <PressableScale style={styles.profileRow} activeScale={0.97} onPress={() => go('/account')}>
            <View style={styles.avatar}>
              <ThemedText variant="title" color={colors.white}>
                {(displayName || '?').slice(0, 1).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.flex}>
              <ThemedText variant="label" weight="bold" color={colors.white} numberOfLines={1}>
                {displayName}
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.7)" numberOfLines={1}>
                View your account
              </ThemedText>
            </View>
            <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
          </PressableScale>
        ) : (
          <View style={styles.authRow}>
            <PressableScale style={styles.signInBtn} activeScale={0.96} onPress={() => go('/sign-in')}>
              <ThemedText variant="label" weight="bold" color={colors.ink}>
                Sign in
              </ThemedText>
            </PressableScale>
            <PressableScale style={styles.registerBtn} activeScale={0.96} onPress={() => go('/sign-up')}>
              <ThemedText variant="label" weight="semibold" color={colors.white}>
                Register
              </ThemedText>
            </PressableScale>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick links */}
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <PressableScale key={q.label} style={styles.quick} activeScale={0.94} onPress={() => go(q.href)}>
              <View style={styles.quickIcon}>
                <Icon name={q.icon} size={20} color={colors.primaryDark} />
              </View>
              <ThemedText variant="caption" weight="medium">
                {q.label}
              </ThemedText>
            </PressableScale>
          ))}
        </View>

        <ThemedText variant="overline" style={styles.sectionLabel}>
          Shop by category
        </ThemedText>

        {error ? (
          <View style={styles.note}>
            <Icon name="wifi-off" size={16} color={colors.textMuted} />
            <ThemedText variant="caption" muted style={styles.flex}>
              Couldn't load categories. Check your connection.
            </ThemedText>
          </View>
        ) : isLoading ? (
          <View style={{ gap: spacing.sm }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.id} style={styles.sectionBlock}>
              <PressableScale
                style={styles.sectionHead}
                activeScale={0.98}
                onPress={() => go(`/section/${section.slug}?title=${encodeURIComponent(section.name)}`)}
              >
                <ThemedText variant="title" weight="bold">
                  {section.name}
                </ThemedText>
                <Icon name="arrow-right" size={16} color={colors.primaryDark} />
              </PressableScale>

              {section.categories.map((c) => (
                <PressableScale
                  key={c.id}
                  style={styles.catRow}
                  activeScale={0.97}
                  onPress={() =>
                    go(
                      `/section/${section.slug}?category=${c.slug}&title=${encodeURIComponent(c.name)}`,
                    )
                  }
                >
                  <View style={styles.catThumb}>
                    {c.image_url ? (
                      <Image source={c.image_url} style={styles.catImg} contentFit="cover" transition={150} />
                    ) : (
                      <Icon name="tag" size={15} color={colors.primaryDark} />
                    )}
                  </View>
                  <ThemedText variant="body" style={styles.flex} numberOfLines={1}>
                    {c.name}
                  </ThemedText>
                  <Icon name="chevron-right" size={16} color={colors.textSubtle} />
                </PressableScale>
              ))}
            </View>
          ))
        )}

        {/* Footer actions */}
        <View style={styles.footer}>
          <PressableScale
            style={styles.footerRow}
            activeScale={0.97}
            onPress={() => {
              close();
              Linking.openURL(env.STORE_OUTLET_URL);
            }}
          >
            <Icon name="map-pin" size={18} color={colors.text} />
            <ThemedText variant="body" weight="medium" style={styles.flex}>
              Visit our Lahore outlet
            </ThemedText>
            <Icon name="external-link" size={16} color={colors.textSubtle} />
          </PressableScale>

          {user && (
            <PressableScale
              style={styles.footerRow}
              activeScale={0.97}
              onPress={() => {
                close();
                signOut();
              }}
            >
              <Icon name="log-out" size={18} color={colors.danger} />
              <ThemedText variant="body" weight="medium" color={colors.danger} style={styles.flex}>
                Sign out
              </ThemedText>
            </PressableScale>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomRightRadius: radius['2xl'],
    overflow: 'hidden',
    gap: spacing.base,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  brandBadge: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.md,
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  avatar: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authRow: { flexDirection: 'row', gap: spacing.sm },
  signInBtn: {
    flex: 1,
    backgroundColor: colors.gold[400],
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  registerBtn: {
    flex: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  body: { padding: spacing.lg, gap: spacing.base },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  quickIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { marginTop: spacing.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  skeletonRow: { height: ms(44), borderRadius: radius.md, backgroundColor: colors.neutral[200] },
  sectionBlock: { gap: 2 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  catThumb: {
    width: ms(34),
    height: ms(34),
    borderRadius: radius.sm,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catImg: { width: '100%', height: '100%' },
  footer: {
    marginTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
