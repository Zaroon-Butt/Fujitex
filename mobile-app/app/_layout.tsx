import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { useAuthStore } from '@/features/auth/store';
import { queryClient } from '@/lib/queryClient';
import { useColorScheme, useColors } from '@/theme';

// Keep the native splash up until fonts are ready; our animated splash takes over.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const colors = useColors();
  const scheme = useColorScheme();
  const init = useAuthStore((s) => s.init);

  // Start the auth/session listener once.
  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  // Hand off from the native splash to our animated one as soon as fonts are ready.
  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={!splashDone || scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(drawer)" />
            <Stack.Screen name="product/[slug]" />
            <Stack.Screen name="section/[slug]" />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
            <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="order-confirmation" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
            <Stack.Screen name="sign-up" options={{ presentation: 'modal' }} />
            <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
          </Stack>

          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
