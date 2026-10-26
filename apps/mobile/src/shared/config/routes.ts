import type { Href } from 'expo-router';

// Пути приложения — единственный источник для редиректов и ссылок (expo-router, файлы в src/app).
// Параметры — в квадратных скобках, как имена файлов роутов: router.push({ pathname, params }).
// Кабинет организаций (/app/:orgId/*) в мобилку не переносим (MOBILE_TZ.md)
export const ROUTES = {
  HOME: '/',

  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  MESSENGER_LOGIN: '/messenger-login',

  ONBOARDING: '/onboarding',

  TODAY: '/today',
  PROGRAMS: '/programs',
  LIBRARY: '/library',
  // Свои записи — в стеке справочника: «Назад» возвращает на вкладку, с которой ушли
  LIBRARY_MINE: '/library/mine',
  EXERCISE: '/library/exercises/[exerciseId]',
  STATS: '/stats',
  STATS_WORKOUT: '/stats/workouts/[workoutId]',
  STATS_EXERCISES: '/stats/exercises',
  STATS_EXERCISE: '/stats/exercises/[exerciseId]',
  STATS_RECORDS: '/stats/records',
  STATS_DAY: '/stats/days/[date]',
  PROGRAM: '/programs/[programId]',
  PROGRAM_TEMPLATES: '/programs/templates',
  PROGRAMS_MINE: '/programs/mine',
  PROGRAM_TEMPLATE: '/programs/templates/[templateId]',
  PROGRAM_SHARED: '/programs/shared/[token]',
  PROGRAM_COMPLEX: '/programs/[programId]/complex/[complexId]',
  PROGRAM_ADD_EXERCISE: '/programs/[programId]/add/[complexId]',
  STRETCH: '/library/stretches/[stretchId]',
  ME: '/me',
  ME_SECTION: '/me/[section]',
  ME_DEVELOPER: '/me/developer',
  // Друг — в стеке профиля: открывают из раздела «Друзья», «Назад» возвращает туда
  FRIEND: '/me/friend/[friendId]',

  WORKOUT: '/workout',
  WORKOUT_REPLACE: '/workout/replace/[itemId]',
  WORKOUT_ADD: '/workout/add',
  WORKOUT_SUMMARY: '/workout/[workoutId]/summary',
  WORKOUT_FINISHED: '/workout/[workoutId]/finished',
  WORKOUT_EDIT: '/workout/[workoutId]/edit',
  WORKOUT_EDIT_ADD: '/workout/[workoutId]/edit/add',
  COOLDOWN: '/workout/[workoutId]/cooldown',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

type RouteParams = Record<string, string | number | undefined>;

/**
 * Ссылка на экран с параметрами пути и адреса — buildPath фронта. Пустые параметры не пишем.
 * Приведение к Href: часть экранов ещё не заведена в src/app, и typed routes их не знают
 */
export const routeHref = (pathname: RoutePath, params: RouteParams = {}): Href => {
  const clean = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
  return { pathname, params: clean } as unknown as Href;
};

/**
 * Адрес экрана строкой: параметры подставлены в путь — для виджетов, которые дописывают к ссылке свой
 * параметр (withSupersetTarget) или сравнивают адреса
 */
export const routePath = (pathname: RoutePath, params: RouteParams = {}): string =>
  pathname.replace(/\[(\w+)\]/g, (_, key: string) => encodeURIComponent(String(params[key] ?? '')));
