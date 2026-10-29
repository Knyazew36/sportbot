import '../global.css';
import '@/shared/api/setup';

import { useCallback, useEffect, useState } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from '@expo-google-fonts/onest';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useReducedMotion } from 'react-native-reanimated';

import { registerWorkoutQueue } from '@sportbot/api/entities/workout';
import { getPersistOptions, queryClient, resumePersistedMutations } from '@/shared/api/query-client';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { fontSources } from '@/shared/theme/fonts';
import { Toaster } from '@/shared/ui/kit/Toaster';
import { IntroPoster } from '@/widgets/intro-splash/IntroPoster';

// До восстановления кеша: восстановленной из хранилища мутации нужен mutationFn.
// Без этого подходы, правки и завершение тренировки падали с «No mutationFn found»
registerWorkoutQueue(queryClient);

// Сплэш держим, пока не догрузились плакатные шрифты: без них первая отрисовка дёрнется
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function LayoutRoot() {
  const [fontsLoaded, fontError] = useFonts(fontSources);
  const [persistOptions] = useState(getPersistOptions);
  // Заставка один раз на запуск, поверх экранов; кто просил систему меньше анимаций — сразу в приложение
  const reduced = useReducedMotion();
  const [intro, setIntro] = useState(!reduced);
  const hideIntro = useCallback(() => setIntro(false), []);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    // Фон по умолчанию — бумага темы: всё, что не закрасил экран (переходы, шторки, клавиатура), не светит белым
    <GestureHandlerRootView className="bg-sb-paper flex-1">
      {/* Клавиатура для KeyboardAwareScrollView: с edge-to-edge Android сам окно не сдвигает */}
      <KeyboardProvider>
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
          <Toaster />
          {/* Диалоги подтверждения (AlertDialog) — последним, поверх всего */}
          <PortalHost />
        </PersistQueryClientProvider>
        {/* Последним, поверх всего: плакатные шрифты к этому моменту уже загружены */}
        {intro && <IntroPoster onDone={hideIntro} />}
      </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
