import { useEffect, useRef } from 'react';

import { resolveWarmup } from '@sportbot/api/lib/day';

import { useProfile } from '@/shared/local/entities/profile';
import { usePrograms, useProgram } from '@/shared/local/entities/program';
import { useStartWorkout as useStartMutation } from '@/shared/local/entities/workout';

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

  // Заставка разминки вместо лоадера, пока тренировка пишется в базу: минуты и первое упражнение
  // известны по комплексу заранее, тикающий таймер запустит уже настоящий экран
  const profile = useProfile();
  const minutes = complex && profile.data ? resolveWarmup(complex, profile.data) : null;
  const first = complex?.exercises[0]?.name;
  const warmup = minutes && first ? { minutes, first } : null;

  useEffect(() => {
    if (started.current || checking || empty) return;
    started.current = true;
    start.mutate(complexId);
  }, [complexId, start, checking, empty]);

  return { start, empty, warmup };
};
