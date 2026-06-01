import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuthActions } from '@/features/auth/store';
import { env } from '@/lib/env';
import { gradients, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

const PERKS: { icon: IconName; label: string }[] = [
  { icon: 'truck', label: 'Track orders' },
  { icon: 'zap', label: 'Faster checkout' },
  { icon: 'heart', label: 'Save favourites' },
];

export default function SignUpScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { signUp } = useAuthActions();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const dismiss = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  async function onSubmit() {
    setError(null);
    if (!fullName.trim()) return setError('Please enter your name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setDone(true);
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <PressableScale onPress={dismiss} style={styles.iconBtn} activeScale={0.9}>
              <Icon name="chevron-down" size={24} color={colors.text} />
            </PressableScale>
            <PressableScale onPress={() => router.replace('/sign-in')} activeScale={0.95}>
              <ThemedText variant="label" weight="semibold" color={colors.primaryDark}>
                Sign in
              </ThemedText>
            </PressableScale>
          </View>

          {done ? (
            <Animated.View entering={FadeInDown.duration(450)} style={styles.success}>
              <LinearGradient colors={gradients.brand} style={styles.successIcon}>
                <Icon name="mail" size={32} color={colors.white} />
              </LinearGradient>
              <ThemedText variant="h1" align="center">
                Check your inbox
              </ThemedText>
              <ThemedText variant="body" muted align="center" style={styles.successText}>
                We've sent a confirmation link to{' '}
                <ThemedText variant="body" weight="semibold" color={colors.text}>
                  {email}
                </ThemedText>
                . Confirm your email, then sign in.
              </ThemedText>
              <Button
                label="Go to Sign In"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/sign-in')}
                style={styles.submit}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(420)}>
              {/* Brand mark + heading */}
              <View style={styles.brandMark}>
                <LinearGradient colors={gradients.brand} style={styles.brandCircle}>
                  <Icon name="feather" size={26} color={colors.gold[300]} />
                </LinearGradient>
              </View>
              <ThemedText variant="overline" align="center">
                Join {env.STORE_NAME}
              </ThemedText>
              <ThemedText variant="display" align="center" style={styles.title}>
                Create your account
              </ThemedText>
              <ThemedText variant="body" muted align="center" style={styles.subtitle}>
                One account for premium fabric — orders, faster checkout, and more.
              </ThemedText>

              {/* Perks */}
              <View style={styles.perks}>
                {PERKS.map((p) => (
                  <View key={p.label} style={styles.perk}>
                    <View style={styles.perkIcon}>
                      <Icon name={p.icon} size={16} color={colors.primaryDark} />
                    </View>
                    <ThemedText variant="caption" weight="medium" align="center">
                      {p.label}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Form */}
              <View style={styles.form}>
                <TextField
                  label="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ahmed Khan"
                  autoCapitalize="words"
                  icon="user"
                />
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon="mail"
                />
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  secureTextEntry
                  autoComplete="password-new"
                  icon="lock"
                />

                {!!error && (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle" size={16} color={colors.danger} />
                    <ThemedText variant="caption" color={colors.danger} style={styles.flex}>
                      {error}
                    </ThemedText>
                  </View>
                )}

                <Button
                  label="Create Account"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={onSubmit}
                  rightIcon="arrow-right"
                  style={styles.submit}
                />

                <ThemedText variant="caption" muted align="center" style={styles.terms}>
                  By continuing you agree to our Terms of Service and Privacy Policy.
                </ThemedText>
              </View>

              <View style={styles.footer}>
                <ThemedText variant="body" muted>
                  Already have an account?{' '}
                </ThemedText>
                <PressableScale onPress={() => router.replace('/sign-in')} activeScale={0.95}>
                  <ThemedText variant="body" weight="bold" color={colors.primaryDark}>
                    Sign in
                  </ThemedText>
                </PressableScale>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  iconBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  brandMark: { alignItems: 'center', marginBottom: spacing.base },
  brandCircle: {
    width: ms(72),
    height: ms(72),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.brand,
  },
  title: { marginTop: 4, textAlign: 'center' },
  subtitle: { marginTop: spacing.xs, maxWidth: ms(340), alignSelf: 'center' },
  perks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  perk: { alignItems: 'center', gap: spacing.xs, width: ms(84) },
  perkIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { marginTop: spacing.xl, gap: spacing.base },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submit: { marginTop: spacing.sm },
  terms: { marginTop: spacing.xs, maxWidth: ms(320), alignSelf: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  success: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing['4xl'] },
  successIcon: {
    width: ms(84),
    height: ms(84),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.brand,
  },
  successText: { maxWidth: ms(320) },
});
