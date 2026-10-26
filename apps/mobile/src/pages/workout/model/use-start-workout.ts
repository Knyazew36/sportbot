import { useEffect, useRef } from 'react';

import { usePrograms, useProgram } from '@sportbot/api/entities/program';
import { useStartWorkout as useStartMutation } from '@sportbot/api/entities/workout';

/**
 * Старт тренировки по complexId. Пустой комплекс не стартуем: возвращаем его, чтобы экран
 * предложил добавить упражнения. Не узнали состав (нет сети, комплекс не из активной) — решает сервер
 */
export const useStartWorkout = (complexId?: number) => {
  const start = useStartMutation();
  const started = useRef(false);
  const programs = usePrograms();
  const activeId = programs.data?.find((p) => p.active)?.id;
  const program = useProgram(activeId);

  const complex = complexId == null ? undefined : program.data?.complexes.find((c) => c.id === complexId);
  // Пока состав неизвестен, не стартуем: иначе пустой комплекс успеет создать тренировку
  const checking = complexId != null && (programs.isPending || (activeId != null && program.isPending));
  const empty =
    complex && program.data && !complex.exercises.length
      ? { programId: program.data.id, complexId: complex.id, title: complex.name }
      : null;

  useEffect(() => {
    if (started.current || checking || empty) return;
    started.current = true;
    start.mutate(complexId);
  }, [complexId, start, checking, empty]);

  return { start, empty };
};
