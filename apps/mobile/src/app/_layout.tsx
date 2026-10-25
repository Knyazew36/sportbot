import '../global.css';
import '@/shared/api/setup';

import { useEffect, useState } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from '@expo-google-fonts/onest';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { getPersistOptions, queryClient, resumePersistedMutations } from '@/shared/api/query-client';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeProvider';
import { fontSources } from '@/shared/theme/fonts';

// Сплэш держим, пока не догрузились плакатные шрифты: без них первая отрисовка дёрнется
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const AppToaster = () => {
  const { colors } = useTheme();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: { backgroundColor: colors.ink },
        titleStyle: { color: colors.paper },
      }}
    />
  );
};

export default function LayoutRoot() {
  const [fontsLoaded, fontError] = useFonts(fontSources);
  const [persistOptions] = useState(getPersistOptions);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
          onSuccess={resumePersistedMutations}
        >
          {/* Шторки рисуются здесь, поверх экранов, но внутри темы и клиента запросов */}
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </BottomSheetModalProvider>
          <AppToaster />
          {/* Диалоги подтверждения (AlertDialog) — последним, поверх всего */}
          <PortalHost />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
