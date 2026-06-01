import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { fontFamily, fontSize, ms, radius, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import { Icon, type IconName } from './Icon';
import { ThemedText } from './ThemedText';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: IconName;
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  error,
  icon,
  containerStyle,
  onFocus,
  onBlur,
  style,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  // Password fields start hidden; the eye toggle reveals them.
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={containerStyle}>
      {!!label && (
        <ThemedText variant="label" weight="medium" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.field, { borderColor }, focused && styles.focused]}>
        {icon && <Icon name={icon} size={18} color={focused ? colors.primary : colors.textMuted} />}
        <TextInput
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          secureTextEntry={secureTextEntry ? hidden : false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Icon
              name={hidden ? 'eye' : 'eye-off'}
              size={18}
              color={focused ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <ThemedText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: { marginBottom: spacing.xs },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderRadius: radius.md,
      paddingHorizontal: spacing.base,
      minHeight: ms(50),
    },
    focused: { backgroundColor: colors.surface },
    input: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      color: colors.text,
      paddingVertical: spacing.md,
    },
    eye: { paddingVertical: spacing.xs, paddingLeft: spacing.xs },
    error: { marginTop: spacing.xs },
  });
