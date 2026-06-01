import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartTabIcon } from '@/components/CartTabIcon';
import { Icon, type IconName } from '@/components/ui/Icon';
import { font, ms, shadows, useColors, useThemedStyles, type ThemeColors } from '@/theme';

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon name={name} size={size} color={color as string} />
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral[400],
        // Grow the bar by the bottom safe-area inset so the tab buttons sit
        // above the Android nav bar / iPhone home indicator instead of under it.
        tabBarStyle: [styles.tabBar, { height: ms(64) + insets.bottom, paddingBottom: insets.bottom + ms(8) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Shop', tabBarIcon: tabIcon('grid') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <View>
              <CartTabIcon color={color as string} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: tabIcon('user') }}
      />
    </Tabs>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: ms(6),
    ...shadows.lg,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: { fontFamily: 'Inter_500Medium', fontSize: font(11), marginTop: 2 },
});
