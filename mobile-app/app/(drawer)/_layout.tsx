import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';
import { CategoryDrawer } from '@/components/CategoryDrawer';
import { useColors } from '@/theme';

/**
 * Drawer navigator that wraps the bottom-tab app. The hamburger in the Home
 * top bar opens it; it slides in from the left with the CMS-driven category
 * navigation (sections → categories). Mirrors the web storefront's mobile nav.
 */
export default function DrawerLayout() {
  const colors = useColors();
  const { width } = useWindowDimensions();

  return (
    <Drawer
      drawerContent={(props) => <CategoryDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: colors.bg,
          width: Math.min(width * 0.86, 360),
        },
        overlayColor: 'rgba(10,10,10,0.45)',
        swipeEdgeWidth: 44,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home' }} />
    </Drawer>
  );
}
