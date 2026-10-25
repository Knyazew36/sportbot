import { haptic } from './haptics';

/** Конец таймера: вибрация — каждое по своей настройке профиля (frontend-tz, 13.2) */
export const timerEndSignal = ({ timerSound, timerVibration }: { timerSound: boolean; timerVibration: boolean }) => {
  // В мобильном приложении звук требует аудио-ресурс; в MVP ограничиваемся вибрацией
  if (timerSound) haptic.warning();
  if (timerVibration) haptic.success();
};
