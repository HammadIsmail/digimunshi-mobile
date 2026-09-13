import { Stack, useRouter, useSegments } from 'expo-router';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { View, LogBox, Platform } from 'react-native';
import { StartupLoadingScreen } from '@/components/StartupLoadingScreen';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  'props.pointerEvents is deprecated. Use style.pointerEvents',
]);

if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('shadow*') || args[0].includes('pointerEvents'))
    ) {
      return;
    }
    origWarn(...args);
  };
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashDone(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const showLoading = isLoading || !minSplashDone;

  useEffect(() => {
    if (showLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, showLoading, segments]);

  if (showLoading) {
    return <StartupLoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <RootLayoutNav />
        <StatusBar style="dark" />
      </VoiceProvider>
    </AuthProvider>
  );
}
