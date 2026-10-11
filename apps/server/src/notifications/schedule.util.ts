import { appTimeZone, zonedParts } from '@/common/utils';

/**
 * Пора ли слать cron-событие по org-расписанию (NotificationsService.getEventSchedule).
 *
 * Сверяем только час, не минуту: тик кронов — раз в час (@Cron(EVERY_HOUR)), и точное совпадение
 * до минуты ловило окно только при идеальном совпадении такта с настройкой — любая микрозадержка
 * (GC-пауза, нагрузка на event loop) сбивала его, и рассылка молча пропускалась на весь день.
 * День и час — в поясе приложения (APP_TIMEZONE), а не сервера: сервер может жить в UTC.
 */
export function isScheduledNow(
  schedule: { daysOfWeek: number[]; notificationTime: string },
  now = new Date(),
  timeZone = appTimeZone(),
): boolean {
  const { weekday, hour } = zonedParts(now, timeZone);
  if (!schedule.daysOfWeek.includes(weekday)) return false;

  const targetHours = Number(schedule.notificationTime.split(':')[0]);
  return !Number.isNaN(targetHours) && hour === targetHours;
}
