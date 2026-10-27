import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { AppState } from 'react-native';

const NOTIFICATION_ID = 'rest-timer';

type TimerLike = { status: 'idle' | 'running' | 'paused'; endsAt: number | null };

/**
 * Локальное уведомление «отдых закончился»: ставится, когда таймер отдыха идёт и приложение в фоне,
 * отменяется при паузе/сбросе/возврате в приложение. Сдвинули конец отдыха (кнопка «+30 с» в уведомлении) —
 * переставляем на новое время
 */
export const useRestNotification = (timer: TimerLike | undefined) => {
  const [active, setActive] = useState(AppState.currentState === 'active');
  // На какой конец отдыха уведомление уже стоит
  const scheduledFor = useRef<number | null>(null);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    return () => appState.remove();
  }, []);

  const endsAt = timer?.status === 'running' ? timer.endsAt : null;

  useEffect(() => {
    if (active || endsAt === null || endsAt <= Date.now()) {
      if (scheduledFor.current !== null) {
        Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
        scheduledFor.current = null;
      }
      return;
    }
    if (scheduledFor.current === endsAt) return;
    // Тот же identifier: новое расписание заменяет прежнее
    Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'Отдых закончился',
        body: 'Пора к следующему подходу',
        sound: true,
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
    }).catch(() => {});
    scheduledFor.current = endsAt;
  }, [active, endsAt]);
};
