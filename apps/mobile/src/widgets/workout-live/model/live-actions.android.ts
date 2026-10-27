import { AppState } from 'react-native';

import { addToTimer, readTimer, writeTimer } from '@/shared/lib/hooks/use-deadline-timer';

import { restTimerKey } from '@/widgets/live-workout-bar/constants';

import { consumeLiveActions, type LiveAction, WorkoutLive } from './native-module';

/** Секунд за нажатие «+30 с» — столько же прибавляет кнопка на экране отдыха */
const ADD_SECONDS = 30;

// Тот же таймер отдыха, что на экране тренировки: «Пропустить» — как timer.stop(), «+30 с» — как timer.add(30)
const apply = (action: LiveAction) => {
  const key = restTimerKey(action.workoutId);
  if (action.type === 'skip') writeTimer(key, { status: 'idle' });
  else writeTimer(key, addToTimer(readTimer(key), ADD_SECONDS, action.at));
};

const drain = () => consumeLiveActions().forEach(apply);

/**
 * Применяет к таймеру отдыха нажатия кнопок уведомления: сразу, если приложение живо,
 * иначе при запуске и возврате из фона. Возвращает отписку
 */
export const watchLiveActions = () => {
  drain();
  const native = WorkoutLive?.addListener('onAction', drain);
  const appState = AppState.addEventListener('change', (next) => {
    if (next === 'active') drain();
  });
  return () => {
    native?.remove();
    appState.remove();
  };
};
