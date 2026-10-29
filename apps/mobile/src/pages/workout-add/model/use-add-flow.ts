import { useState } from 'react';
import { router } from 'expo-router';

import { type Workout } from '@sportbot/api/entities/workout';
import { useAddItems } from '@/shared/local/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { local } from '@/shared/lib/local';

/** Добавление в идущую тренировку: выбранные в подборе ждут ответа «только сегодня или в комплекс» */
export const useAddFlow = (workout: Workout) => {
  const add = useAddItems();
  const [picked, setPicked] = useState<number[] | null>(null);

  const apply = (inComplex: boolean) => {
    if (!picked) return;
    const before = new Set(workout.exercises.map((e) => e.id));
    void add.mutateAsync({ workoutId: workout.id, exerciseIds: picked, inComplex }).then((next) => {
      // Добавили посреди тренировки — остаёмся на текущем упражнении. Всё прежнее сделано —
      // открываем первое добавленное, иначе экран так и стоял бы на последнем сделанном
      const added = next.exercises.find((e) => !before.has(e.id));
      if (added && workout.exercises.every((e) => e.done)) local.set(`workout-picked-${workout.id}`, String(added.id));
      // Тренировка лежит под подбором в стеке — возвращаемся к ней
      if (router.canGoBack()) router.back();
      else router.replace(ROUTES.WORKOUT);
    });
  };

  return { picked, setPicked, apply, pending: add.isPending };
};
