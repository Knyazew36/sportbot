import { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';

import { useSportUser } from '@sportbot/api/entities/sport-user';

import { useIsAuthenticated } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { CurrentWorkoutBar } from '@/widgets/live-workout-bar/CurrentWorkoutBar';

// Гвард приложения: без токена — на вход; не пройден онбординг — на настройку, пройден — с настройки на «Сегодня»
const AppGuard = () => {
  const isAuthenticated = useIsAuthenticated();
  // Профиль создаётся первым запросом (miniapp/me), в нём же флаг онбординга — второй запрос не нужен
  const me = useSportUser({ enabled: isAuthenticated });
  const pathname = usePathname();
  const router = useRouter();

  // Смотрим на данные, а не на isSuccess: после неудачного обновления без сети статус error,
  // но сохранённый профиль остаётся — по нему и пускаем в зале
  const onboarded = me.data?.onboarded;

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

  // Профиля ещё нет: загрузка или ошибка с «Повторить» — иначе без сервера вечный спиннер
  if (!isAuthenticated || onboarded === undefined) {
    return (
      <Screen fullscreen scroll={false}>
        <QueryState query={me}>{() => null}</QueryState>
      </Screen>
    );
  }

  return (
    // Живая полоса — над всем стеком, одна на приложение: переходы между экранами её не перерисовывают
    <CurrentWorkoutBar>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Тренировка — поверх табов целиком: меню на ней не нужно, а назад ведёт на «Сегодня» */}
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </CurrentWorkoutBar>
  );
};

// Приложение целиком: табы, тренировка поверх них, онбординг. Кабинета организаций нет (MOBILE_TZ.md)
export default function LayoutApp() {
  return <AppGuard />;
}
