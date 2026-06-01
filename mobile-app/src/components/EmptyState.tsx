import { StyleSheet, View } from 'react-native';
import { ms, radius, spacing, useColors } from '@/theme';
import { Button } from './ui/Button';
import { Icon, type IconName } from './ui/Icon';
import { ThemedText } from './ui/ThemedText';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: EmptyStateProps) {
  const colors = useColors();
  const accent = tone === 'error' ? colors.danger : colors.primary;
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: tone === 'error' ? colors.dangerSoft : colors.brand[50] }]}>
        <Icon name={icon} size={28} color={accent} />
      </View>
      <ThemedText variant="h3" align="center">
        {title}
      </ThemedText>
      {!!message && (
        <ThemedText variant="body" muted align="center" style={styles.message}>
          {message}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  iconCircle: {
    width: ms(72),
    height: ms(72),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: { maxWidth: ms(320) },
  action: { marginTop: spacing.sm, alignSelf: 'center' },
});
