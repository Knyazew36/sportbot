import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';

let asked: Promise<boolean> | null = null;

/**
 * Разрешение на уведомления: «Отдых закончился» и тренировка на экране блокировки Android.
 * Спрашиваем один раз за запуск и только когда тренировка уже идёт — так понятно, зачем оно.
 * Отказ не ломает тренировку: просто не будет уведомлений
 */
export const ensureNotificationPermission = () =>
  (asked ??= (async () => {
    const current = await getPermissionsAsync();
    if (current.granted) return true;
    // Отказали навсегда — системный диалог больше не покажется, включают только в настройках
    if (!current.canAskAgain) return false;
    const next = await requestPermissionsAsync();
    return next.granted;
  })().catch(() => {
    asked = null;
    return false;
  }));
