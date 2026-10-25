import type { ReactNode } from 'react';
import { router, usePathname, type Href } from 'expo-router';

import { useCurrentWorkout, useQueuedWorkout } from '@sportbot/api/entities/workout';

import { ROUTES } from '@/shared/config/routes';

import { restTimerKey } from './constants';
import { LiveWorkoutBar } from './LiveWorkoutBar';
import { useRestRunning } from './use-rest-running';

// Полоса над разделами: тренировка идёт, а человек листает справочник или статистику — касание ведёт обратно.
// Под экраном тренировки (он поверх табов) полосу не держим: её тёмный статус-бар перебил бы фокус в тёмной теме
export const CurrentWorkoutBar = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const current = useCurrentWorkout();
  const { workout, finishing } = useQueuedWorkout(current.data?.workout);
  // Завершение ждёт сети: возвращаться уже не к чему
  const live = workout && !finishing ? workout : null;
  const resting = useRestRunning(live ? restTimerKey(live.id) : undefined);

  return (
    <LiveWorkoutBar
      visible={Boolean(live) && !pathname.startsWith(ROUTES.WORKOUT)}
      resting={resting}
      label={live?.complexName}
      onReturn={() => router.push(ROUTES.WORKOUT as Href)}
    >
      {children}
    </LiveWorkoutBar>
  );
};
