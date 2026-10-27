import { WorkoutActivity } from '../WorkoutActivity';

import { WORKOUT_URL } from './constants';
import type { WorkoutLiveProps } from './types';

/** Live Activity: одна на тренировку. null — тренировки нет, снимаем с экрана сразу */
export const syncWorkoutLive = async (props: WorkoutLiveProps | null) => {
  const [current, ...extra] = WorkoutActivity.getInstances();
  // Лишние остаются от прошлого запуска, если приложение убили посреди тренировки
  await Promise.all(extra.map((activity) => activity.end('immediate')));

  if (!props) {
    await current?.end('immediate');
    return;
  }
  if (current) await current.update(props);
  else WorkoutActivity.start(props, WORKOUT_URL);
};
