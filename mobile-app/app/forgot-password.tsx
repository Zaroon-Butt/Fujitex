import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuthActions } from '@/features/auth/store';
import { env } from '@/lib/env';
import { font, gradients, ms, radius, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

type Phase = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, resetPassword } = useAuthActions();

  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dismiss = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));

  async function onRequest() {
    setError(null);
    if (!email.trim()) {
      setError('Enter your account email.');
      return;
    }
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setPhase('reset');
  }

  async function onReset() {
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email, code, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    // verifyOtp signed the user in and the password is updated — go to account.
    router.replace('/account');
  }

  const isReset = phase === 'reset';

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.hero} style={[styles.hero, { paddingTop: insets.top + spacing.base }]}>
        <View style={styles.glowGold} />
        <PressableScale onPress={dismiss} style={styles.close} activeScale={0.9}>
          <Icon name="x" size={22} color={colors.white} />
        </PressableScale>
        <View style={styles.heroBadge}>
          <Icon name="lock" size={13} color={colors.gold[200]} />
          <ThemedText weight="bold" color={colors.gold[200]} style={styles.badgeText}>
            {isReset ? 'ALMOST THERE' : 'ACCOUNT RECOVERY'}
          </ThemedText>
        </View>
        <ThemedText variant="display" color={colors.white} style={styles.heroTitle}>
          {isReset ? 'Set a new password' : 'Reset your password'}
        </ThemedText>
        <ThemedText variant="body" color="rgba(255,255,255,0.85)">
          {isReset
            ? `Enter the code we sent to ${email} and choose a new password.`
            : `We'll email you a 6-digit code to reset your ${env.STORE_NAME} password.`}
        </ThemedText>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isReset ? (
            <>
              <TextField
                label="Reset code"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                icon="shield"
              />
              <TextField
                label="New password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="new-password"
                icon="lock"
              />
              <TextField
                label="Confirm new password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                icon="lock"
              />
            </>
          ) : (
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
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={16} color={colors.danger} />
              <ThemedText variant="caption" color={colors.danger} style={styles.flex}>
                {error}
              </ThemedText>
            </View>
          )}

          <Button
            label={isReset ? 'Update password' : 'Send reset code'}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={isReset ? onReset : onRequest}
            style={styles.submit}
          />

          {isReset ? (
            <View style={styles.footer}>
              <ThemedText variant="body" muted>
                Didn't get it?{' '}
              </ThemedText>
              <PressableScale onPress={onRequest} activeScale={0.95} disabled={loading}>
                <ThemedText variant="body" weight="bold" color={colors.primaryDark}>
                  Resend code
                </ThemedText>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.footer}>
              <ThemedText variant="body" muted>
                Remembered it?{' '}
              </ThemedText>
              <PressableScale onPress={dismiss} activeScale={0.95}>
                <ThemedText variant="body" weight="bold" color={colors.primaryDark}>
                  Back to sign in
                </ThemedText>
              </PressableScale>
            </View>
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
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius['3xl'],
    borderBottomRightRadius: radius['3xl'],
    overflow: 'hidden',
    gap: spacing.xs,
  },
  glowGold: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: ms(220),
    height: ms(220),
    borderRadius: ms(110),
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  close: {
    alignSelf: 'flex-end',
    width: ms(40),
    height: ms(40),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(252,211,77,0.32)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: font(11), letterSpacing: 2 },
  heroTitle: { marginTop: spacing.sm },
  form: { padding: spacing.lg, gap: spacing.base },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submit: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
});
