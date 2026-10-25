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
  EXERCISE: '/library/exercises/[exerciseId]',
  STATS: '/stats',
  STATS_WORKOUT: '/stats/workouts/[workoutId]',
  ME: '/me',
  ME_SECTION: '/me/[section]',

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
