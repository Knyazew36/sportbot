import { useEffect } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, usePathname, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSportUser } from '@sportbot/api/entities/sport-user';

import { bindSessionUser, useIsAuthenticated, useKnownUserId, useSessionExpired } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { DbProvider } from '@/shared/db';
import { useOnboardedLocally } from '@/shared/local/entities/onboarding';
import { SyncRunner } from '@/shared/sync';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { UndoBar } from '@/shared/ui/kit/UndoBar';
import { isTabPath, NAV_ROW } from '@/widgets/bottom-nav/nav';
import { CurrentWorkoutBar } from '@/widgets/live-workout-bar/CurrentWorkoutBar';

/**
 * Не пройден онбординг — на настройку, пройден — с настройки на «Сегодня». Под базой: настройку,
 * законченную офлайн, сервер узнает только синком, а пускать дальше надо сразу
 */
const OnboardingRedirect = ({ serverOnboarded }: { serverOnboarded: boolean | undefined }) => {
  const local = useOnboardedLocally();
  const pathname = usePathname();
  const router = useRouter();
  // Закончил хоть где-то — пройдено: в боте (телефон ещё не синкался) или на телефоне (сервер ещё не знает)
  const onboarded = serverOnboarded || !!local.data?.done;
  // Без сети сервер молчит, а база ещё открывается или пуста: на настройку не уводим, пока не знаем
  const undecided = serverOnboarded === undefined && local.data?.done == null;

  useEffect(() => {
    if (undecided) return;
    const onOnboardingScreen = pathname === ROUTES.ONBOARDING;
    if (!onboarded && !onOnboardingScreen) router.replace(ROUTES.ONBOARDING);
    if (onboarded && onOnboardingScreen) router.replace(ROUTES.TODAY);
  }, [onboarded, undecided, pathname, router]);

  return null;
};

// Гвард приложения: без токена — на вход, онбординг — OnboardingRedirect.
// Протухший токен — не выход: профиль сохранён на телефоне, работаем офлайн, синк ждёт входа (SessionExpiredBanner)
const AppGuard = () => {
  const isAuthenticated = useIsAuthenticated();
  const expired = useSessionExpired();
  // Аккаунт по памяти телефона: кеш профиля живёт сутки, а пускать в зале надо и через неделю
  const knownUserId = useKnownUserId();
  // Профиль создаётся первым запросом (miniapp/me), в нём же флаг онбординга — второй запрос не нужен
  const me = useSportUser({ enabled: isAuthenticated });
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Смотрим на данные, а не на isSuccess: после неудачного обновления без сети статус error,
  // но сохранённый профиль остаётся. Нет и его — онбординг решает база телефона (OnboardingRedirect)
  const onboarded = me.data?.onboarded;
  const serverUserId = me.data?.userId;
  const userId = serverUserId ?? knownUserId;

  useEffect(() => {
    if (serverUserId !== undefined) bindSessionUser(serverUserId);
  }, [serverUserId]);

  // Протухший токен — не выход: аккаунт на телефоне известен, работаем на его базе
  const signedIn = isAuthenticated || expired;

  useEffect(() => {
    if (!signedIn) router.replace(ROUTES.LOGIN);
  }, [signedIn, router]);

  // Аккаунт неизвестен (первый запуск после входа): загрузка или ошибка с «Повторить»
  if (!signedIn || userId === undefined) {
    return (
      <Screen fullscreen scroll={false}>
        <QueryState query={me}>{() => null}</QueryState>
      </Screen>
    );
  }

  // Плашка отмены — над всем стеком: правят и на экранах поверх табов (редактор программы).
  // Над меню, если открыт раздел, иначе над жестовой полосой — как navVisible у UndoBar фронта
  const undoBottom = isTabPath(pathname) ? NAV_ROW + Math.max(8, insets.bottom) + 12 : Math.max(16, insets.bottom + 8);

  return (
    // Локальная база — своя на пользователя: key пересоздаёт всё под ней при смене аккаунта
    <DbProvider key={userId} userId={userId}>
      <SyncRunner />
      <OnboardingRedirect serverOnboarded={onboarded} />
      {/* Свой хост шторок под базой: портал gorhom не переносит контекст, и в шторках корневого хоста
          useLocalDb() был null — правки из шторок падали с «база ещё открывается» */}
      <BottomSheetModalProvider>
        {/* Живая полоса — над всем стеком, одна на приложение: переходы между экранами её не перерисовывают */}
        <CurrentWorkoutBar>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Тренировка — поверх табов целиком: меню на ней не нужно, а назад ведёт на «Сегодня» */}
            <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
          <UndoBar bottom={undoBottom} />
        </CurrentWorkoutBar>
      </BottomSheetModalProvider>
    </DbProvider>
  );
};

// Приложение целиком: табы, тренировка поверх них, онбординг. Кабинета организаций нет (MOBILE_TZ.md)
export default function LayoutApp() {
  return <AppGuard />;
}
