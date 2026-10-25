import { useEffect, useState } from 'react';

import { formatSeconds } from './use-deadline-timer';

/** Прошедшее время тренировки в формате «02:15» */
export const useWorkoutElapsed = (startedAt: string) => {
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - Date.parse(startedAt)) / 1000));

  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - Date.parse(startedAt)) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return formatSeconds(seconds);
};
