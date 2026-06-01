import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuthActions } from '@/features/auth/store';
import { env } from '@/lib/env';
import { gradients, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

export default function SignInScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dismiss = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    dismiss();
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
            <PressableScale onPress={() => router.replace('/sign-up')} activeScale={0.95}>
              <ThemedText variant="label" weight="semibold" color={colors.primaryDark}>
                Create account
              </ThemedText>
            </PressableScale>
          </View>

          <Animated.View entering={FadeInDown.duration(420)}>
            {/* Brand mark + heading */}
            <View style={styles.brandMark}>
              <LinearGradient colors={gradients.brand} style={styles.brandCircle}>
                <Icon name="feather" size={26} color={colors.gold[300]} />
              </LinearGradient>
            </View>
            <ThemedText variant="overline" align="center">
              Welcome back
            </ThemedText>
            <ThemedText variant="display" align="center" style={styles.title}>
              Sign in to {env.STORE_NAME}
            </ThemedText>
            <ThemedText variant="body" muted align="center" style={styles.subtitle}>
              Track your orders and check out faster.
            </ThemedText>

            {/* Form */}
            <View style={styles.form}>
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
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                icon="lock"
              />

              <PressableScale
                onPress={() => router.push('/forgot-password')}
                style={styles.forgot}
                activeScale={0.95}
              >
                <ThemedText variant="caption" weight="semibold" color={colors.primaryDark}>
                  Forgot password?
                </ThemedText>
              </PressableScale>

              {!!error && (
                <View style={styles.errorBox}>
                  <Icon name="alert-circle" size={16} color={colors.danger} />
                  <ThemedText variant="caption" color={colors.danger} style={styles.flex}>
                    {error}
                  </ThemedText>
                </View>
              )}

              <Button
                label="Sign In"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={onSubmit}
                rightIcon="arrow-right"
                style={styles.submit}
              />
            </View>

            <View style={styles.footer}>
              <ThemedText variant="body" muted>
                New here?{' '}
              </ThemedText>
              <PressableScale onPress={() => router.replace('/sign-up')} activeScale={0.95}>
                <ThemedText variant="body" weight="bold" color={colors.primaryDark}>
                  Create an account
                </ThemedText>
              </PressableScale>
            </View>
          </Animated.View>
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
  brandMark: { alignItems: 'center', marginBottom: spacing.base, marginTop: spacing.sm },
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
  form: { marginTop: spacing.xl, gap: spacing.base },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs, paddingVertical: spacing.xs },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submit: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
