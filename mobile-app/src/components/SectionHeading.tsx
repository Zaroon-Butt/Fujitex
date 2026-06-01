import { router } from 'expo-router';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { font, spacing, useColors } from '@/theme';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { ThemedText } from './ui/ThemedText';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
  style?: ViewStyle;
}

/** Eyebrow + display title row, mirroring the web `.section-eyebrow` / `.section-title`. */
export function SectionHeading({
  eyebrow,
  title,
  actionLabel,
  actionHref,
  style,
}: SectionHeadingProps) {
  const colors = useColors();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {!!eyebrow && <ThemedText variant="overline">{eyebrow}</ThemedText>}
        <ThemedText variant="h2" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {actionLabel && actionHref && (
        <PressableScale
          style={styles.action}
          onPress={() => router.push(actionHref as never)}
          activeScale={0.94}
        >
          <ThemedText weight="semibold" color={colors.primaryDark} style={styles.actionText}>
            {actionLabel}
          </ThemedText>
          <Icon name="arrow-right" size={15} color={colors.primaryDark} />
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: { flex: 1, gap: 4 },
  title: { marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
  actionText: { fontSize: font(13) },
});
