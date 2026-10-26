import type { ReactNode } from 'react';
import { router, usePathname, type Href } from 'expo-router';

import { useCurrentWorkout, useQueuedWorkout } from '@sportbot/api/entities/workout';

import { ROUTES } from '@/shared/config/routes';

import { restTimerKey } from './constants';
import { LiveWorkoutBar } from './LiveWorkoutBar';
import { useRestRunning } from './use-rest-running';
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
  const resting = useRestRunning(live ? restTimerKey(live.id) : undefined);
  const onWorkout = pathname.startsWith(ROUTES.WORKOUT);

  return (
    <LiveWorkoutBar
      visible={Boolean(live) && !(onWorkout && screenHidden)}
      resting={resting}
      label={live?.complexName}
      onReturn={() => (onWorkout ? returnToWorkoutFocus() : router.push(ROUTES.WORKOUT as Href))}
    >
      {children}
    </LiveWorkoutBar>
  );
};
