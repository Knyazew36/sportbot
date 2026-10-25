import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';

import { useOnboarding } from '@sportbot/api/entities/onboarding';

import { useIsAuthenticated } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';

// Гвард приложения: без токена — на вход; не пройден онбординг — на настройку, пройден — с настройки на «Сегодня»
const AppGuard = () => {
  const isAuthenticated = useIsAuthenticated();
  const onboarding = useOnboarding({ enabled: isAuthenticated });
  const pathname = usePathname();
  const router = useRouter();

  const onboarded = onboarding.data?.onboarded;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (onboarded === undefined) return;
    const onOnboardingScreen = pathname === ROUTES.ONBOARDING;
    if (!onboarded && !onOnboardingScreen) router.replace(ROUTES.ONBOARDING);
    if (onboarded && onOnboardingScreen) router.replace(ROUTES.TODAY);
  }, [isAuthenticated, onboarded, pathname, router]);

  // Профиль ещё не доехал: не роняем разводку, держим фон темы
  if (!isAuthenticated || onboarded === undefined) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator colorClassName="accent-primary" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Тренировка — поверх табов целиком: меню на ней не нужно, а назад ведёт на «Сегодня» */}
      <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
};

// Приложение целиком: табы, тренировка поверх них, онбординг. Кабинета организаций нет (MOBILE_TZ.md)
export default function LayoutApp() {
  return <AppGuard />;
}
