import { WORKOUT_URL } from './constants';
import { WorkoutLive } from './native-module';
import type { WorkoutLiveProps } from './types';

/**
 * Уведомление идущей тренировки с foreground service (modules/workout-live): одно на тренировку,
 * обновляется на месте. null — тренировки нет, сервис останавливается сразу
 */
export const syncWorkoutLive = async (props: WorkoutLiveProps | null) => {
  if (!WorkoutLive) return;
  if (!props) {
    await WorkoutLive.hide();
    return;
  }
  await WorkoutLive.show(JSON.stringify({ ...props, url: WORKOUT_URL }));
};
