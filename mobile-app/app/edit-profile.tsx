import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { pickAvatarImage, uploadAvatar, type PickedAvatar } from '@/features/account/avatar';
import { useAuthActions, useProfile, useUser } from '@/features/auth/store';
import { ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

// Loose Pakistani mobile sanity check: digits/spaces/dashes, optional +92 or 0
// prefix, 10–13 digits overall. Kept permissive on purpose — phone is optional.
const PHONE_RE = /^(\+?92|0)?[\s-]?3\d{2}[\s-]?\d{7}$/;

export default function EditProfileScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const user = useUser();
  const profile = useProfile();
  const { updateProfile } = useAuthActions();
  const scrollRef = useRef<ScrollView>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  // A just-picked image (not yet uploaded) and the current saved avatar URL.
  const [picked, setPicked] = useState<PickedAvatar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUri = picked?.uri ?? profile?.avatar_url ?? null;
  const initial = (fullName.trim() || user?.email || '?').slice(0, 1).toUpperCase();

  async function onPickImage() {
    setError(null);
    const res = await pickAvatarImage();
    if (res.ok) {
      setPicked(res.asset);
    } else if (res.reason === 'denied') {
      Alert.alert(
        'Photo access needed',
        'Allow photo access in Settings to choose a profile picture.',
      );
    }
  }

  async function onSave() {
    setError(null);
    const name = fullName.trim();
    if (name.length < 2) return setError('Please enter your name (at least 2 characters).');
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !PHONE_RE.test(trimmedPhone)) {
      return setError('Enter a valid Pakistani mobile number (e.g. 0301 2345678).');
    }
    if (!user) return setError('You are not signed in.');

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (picked) avatarUrl = await uploadAvatar(user.id, picked);

      const { error: saveError } = await updateProfile({
        full_name: name,
        phone: trimmedPhone || null,
        avatar_url: avatarUrl,
      });
      if (saveError) {
        setError(saveError);
        return;
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Edit profile" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? undefined : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Avatar picker */}
            <View style={styles.avatarSection}>
              <PressableScale activeScale={0.95} onPress={onPickImage} style={styles.avatarWrap}>
                {previewUri ? (
                  <Image source={previewUri} style={styles.avatar} contentFit="cover" transition={150} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <ThemedText variant="display" color={colors.white}>
                      {initial}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={16} color={colors.white} />
                </View>
              </PressableScale>
              <PressableScale activeScale={0.95} onPress={onPickImage}>
                <ThemedText variant="label" weight="semibold" color={colors.primaryDark}>
                  {previewUri ? 'Change photo' : 'Add photo'}
                </ThemedText>
              </PressableScale>
            </View>

            {/* Fields */}
            <View style={styles.form}>
              <TextField
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ahmed Khan"
                autoCapitalize="words"
                icon="user"
                returnKeyType="next"
              />
              <TextField
                label="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="0301 2345678"
                keyboardType="phone-pad"
                icon="phone"
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
                }}
              />
              <View style={styles.readonly}>
                <Icon name="mail" size={18} color={colors.textMuted} />
                <View style={styles.flex}>
                  <ThemedText variant="caption" muted>
                    Email
                  </ThemedText>
                  <ThemedText variant="label" weight="medium" numberOfLines={1}>
                    {user?.email}
                  </ThemedText>
                </View>
                <Icon name="lock" size={16} color={colors.textSubtle} />
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Icon name="alert-circle" size={16} color={colors.danger} />
                  <ThemedText variant="caption" color={colors.danger} style={styles.flex}>
                    {error}
                  </ThemedText>
                </View>
              )}

              <Button
                label="Save changes"
                variant="primary"
                size="lg"
                fullWidth
                loading={saving}
                onPress={onSave}
                rightIcon="check"
                style={styles.submit}
              />
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
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

    avatarSection: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
    avatarWrap: { width: ms(112), height: ms(112) },
    avatar: { width: ms(112), height: ms(112), borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
    avatarFallback: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.brand,
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: ms(36),
      height: ms(36),
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.bg,
    },

    form: { gap: spacing.base },
    readonly: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      minHeight: ms(50),
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    submit: { marginTop: spacing.sm },
  });
