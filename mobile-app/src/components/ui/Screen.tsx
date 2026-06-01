import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useColors } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Background color (defaults to the cream app background). */
  background?: string;
  /** Which safe-area edges to inset. Default: top + bottom. */
  edges?: Edge[];
  style?: ViewStyle;
}

/**
 * Standard screen wrapper: applies safe-area insets and the app background.
 * Use `edges={[]}` for full-bleed screens (e.g. a hero that runs under the
 * status bar) and inset individual sections instead.
 */
export function Screen({
  children,
  background,
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  const colors = useColors();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: background ?? colors.bg }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

/** Full-bleed variant that ignores safe-area (children handle their own insets). */
export function FullBleedScreen({
  children,
  background,
  style,
}: Omit<ScreenProps, 'edges'>) {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: background ?? colors.bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
