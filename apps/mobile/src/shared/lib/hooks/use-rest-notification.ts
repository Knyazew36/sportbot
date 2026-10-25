import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { AppState } from 'react-native';

const NOTIFICATION_ID = 'rest-timer';

type TimerLike = { status: 'idle' | 'running' | 'paused'; left: number };

/**
 * Локальное уведомление «отдых закончился»: ставится, когда таймер отдыха идёт и приложение в фоне,
 * отменяется при паузе/сбросе/возврате в приложение
 */
export const useRestNotification = (timer: TimerLike | undefined) => {
  const scheduled = useRef(false);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
        scheduled.current = false;
      }
    });
    return () => appState.remove();
  }, []);

  useEffect(() => {
    if (timer?.status !== 'running') {
      if (scheduled.current) {
        Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
        scheduled.current = false;
      }
      return;
    }

    if (AppState.currentState !== 'active' && !scheduled.current) {
      const date = new Date(Date.now() + timer.left * 1000);
      Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: 'Отдых закончился',
          body: 'Пора к следующему подходу',
          sound: true,
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date },
      }).catch(() => {});
      scheduled.current = true;
    }
  }, [timer?.status, timer?.left]);
};
