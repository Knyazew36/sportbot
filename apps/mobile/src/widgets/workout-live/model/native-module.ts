import { type EventSubscription, requireOptionalNativeModule } from 'expo';

/** Нажатие кнопки уведомления: «+30 с» или «Пропустить» отдых */
export type LiveAction = { type: 'add' | 'skip'; workoutId: number; at: number };

type WorkoutLiveModule = {
  show: (state: string) => Promise<void>;
  hide: () => Promise<void>;
  consumeActions: () => string;
  addListener: (event: 'onAction', listener: () => void) => EventSubscription;
};

// Нативный модуль modules/workout-live, есть только на Android.
// Optional: в старой сборке dev client его нет — тренировка идёт без уведомления
export const WorkoutLive = requireOptionalNativeModule<WorkoutLiveModule>('WorkoutLive');

/** Нажатия, которые приложение ещё не применило. Забирает их — второй вызов вернёт пусто */
export const consumeLiveActions = (): LiveAction[] => {
  if (!WorkoutLive) return [];
  try {
    return JSON.parse(WorkoutLive.consumeActions()) as LiveAction[];
  } catch {
    return [];
  }
};
