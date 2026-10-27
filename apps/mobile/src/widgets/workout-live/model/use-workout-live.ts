import { useEffect, useRef, useState } from 'react';

import type { Workout } from '@sportbot/api/entities/workout';

import { ensureNotificationPermission } from '@/shared/lib/notification-permission';
import { storage } from '@/shared/lib/storage';

import { watchLiveActions } from './live-actions';
import { liveKeys, liveProps, nextChangeAt } from './live-props';
import { syncWorkoutLive } from './live-sync';

// Вызовы к нативному слою по очереди: два старта подряд на iOS дали бы две Live Activity
let queue: Promise<void> = Promise.resolve();

/**
 * Держит экран блокировки в такт тренировке: Live Activity на iOS, постоянное уведомление на Android.
 * Таймеры живут в хранилище — подписываемся на него, поэтому экран тренировки может быть закрыт.
 * workout: undefined — ещё не знаем, идёт ли тренировка (запрос грузится), ничего не трогаем
 */
export const useWorkoutLive = (workout: Workout | null | undefined) => {
  const [version, setVersion] = useState(0);
  const shown = useRef<string | null>(null);
  const id = workout?.id;

  // Раньше синхронизации: нажатия, сделанные пока приложение спало, сначала попадают в таймер отдыха,
  // иначе уведомление на миг откатилось бы к старому времени
  useEffect(() => watchLiveActions(), []);

  useEffect(() => {
    if (!id) return;
    const keys = new Set(liveKeys(id));
    const listener = storage.addOnValueChangedListener((changed) => {
      if (keys.has(changed)) setVersion((v) => v + 1);
    });
    return () => listener.remove();
  }, [id]);

  useEffect(() => {
    if (workout === undefined) return;
    const props = workout ? liveProps(workout, Date.now()) : null;
    const json = JSON.stringify(props);
    if (json !== shown.current) {
      shown.current = json;
      queue = queue
        // Без разрешения на Android 13+ уведомление не покажется; на iOS оно нужно уведомлению «Отдых закончился».
        // Пока висит системный диалог, очередь ждёт ответа — уведомление выйдет сразу после «Разрешить»
        .then(() => (props ? ensureNotificationPermission() : undefined))
        .then(() => syncWorkoutLive(props))
        .catch(() => {
          // Live Activity выключены в настройках или нет разрешения на уведомления: тренировка идёт и без них.
          // Сбрасываем, чтобы следующая смена состояния попробовала снова
          shown.current = null;
        });
    }

    // Конец отдыха картинку меняет сам, без записи в хранилище: пересобираем ровно в этот момент
    const next = nextChangeAt(props);
    if (next === null) return;
    const timeout = setTimeout(() => setVersion((v) => v + 1), Math.max(0, next - Date.now()) + 50);
    return () => clearTimeout(timeout);
  }, [workout, version]);
};
