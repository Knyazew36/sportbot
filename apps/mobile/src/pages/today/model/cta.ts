import type { Href } from 'expo-router';

import type { DayToday } from '@sportbot/api/entities/day';

import { ROUTES } from '@/shared/config/routes';

export type Cta = { label: string; href: Href; variant?: 'success' };

const startWorkout = (complexId: number): Href => ({
  pathname: ROUTES.WORKOUT,
  params: { complexId: String(complexId) },
});

/** Главное действие дня у большого пальца. Заминку предлагает только итог тренировки, на главной её нет */
export const dayCta = (day: DayToday): Cta | null => {
  if (day.state === 'TRAINING' && day.complex)
    return { label: 'Начать', href: startWorkout(day.complex.id), variant: 'success' };
  // Внеплановая тренировка в день отдыха (7.2) — зелёная
  if (day.state === 'REST' && day.complex)
    return { label: 'Потренироваться', href: startWorkout(day.complex.id), variant: 'success' };
  if (day.state === 'IN_PROGRESS') return { label: 'Продолжить', href: ROUTES.WORKOUT };
  // Пропуск ещё можно закрыть: тренировка сегодня сама снимет отметку (business-tz, 7.2)
  if (day.state === 'MISSED' && day.next)
    return { label: 'Потренироваться', href: startWorkout(day.next.complexId), variant: 'success' };
  return null;
};

export const workoutHref = startWorkout;
