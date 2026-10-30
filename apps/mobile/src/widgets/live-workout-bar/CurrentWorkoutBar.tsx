import type { ReactNode } from 'react';
import { router, usePathname, type Href } from 'expo-router';

import { useCurrentWorkout, useQueuedWorkout } from '@/shared/local/entities/workout';

import { ROUTES } from '@/shared/config/routes';

import { useWorkoutLive } from '@/widgets/workout-live/model/use-workout-live';

import { restTimerKey, warmupTimerKey, type LivePhase } from './constants';
import { LiveWorkoutBar } from './LiveWorkoutBar';
import { useTimerRunning } from './use-timer-running';
import { returnToWorkoutFocus, useWorkoutScreenHidden } from './workout-screen-bar';

// Полоса одна на всё приложение и висит над стеком: при переходах между экранами она не монтируется заново
// и не выезжает повторно, а просто светится на месте. Под открытым фокусом тренировки её прячем:
// тёмный статус-бар полосы перебил бы фокус в тёмной теме
export const CurrentWorkoutBar = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const current = useCurrentWorkout();
  const { workout, finishing } = useQueuedWorkout(current.data?.workout);
  const screenHidden = useWorkoutScreenHidden();
  // Завершение ждёт сети: возвращаться уже не к чему
  const live = workout && !finishing ? workout : null;
  const resting = useTimerRunning(live ? restTimerKey(live.id) : undefined);
  const warmupRunning = useTimerRunning(live ? warmupTimerKey(live.id) : undefined);
  // Таймер мог остаться в хранилище, когда разминку уже закрыл сервер или первый подход
  const warmingUp = warmupRunning && live && !live.warmupFinishedAt && !live.exercises.some((e) => e.sets.length);
  const phase: LivePhase = resting ? 'rest' : warmingUp ? 'warmup' : 'work';
  // Пока запрос не ответил, не знаем, идёт ли тренировка: не снимаем экран блокировки зря
  useWorkoutLive(current.data ? live : undefined);
  const onWorkout = pathname.startsWith(ROUTES.WORKOUT);

  return (
    <LiveWorkoutBar
      visible={Boolean(live) && !(onWorkout && screenHidden)}
      phase={phase}
      label={live?.complexName}
      onReturn={() => (onWorkout ? returnToWorkoutFocus() : router.push(ROUTES.WORKOUT as Href))}
    >
      {children}
    </LiveWorkoutBar>
  );
};
