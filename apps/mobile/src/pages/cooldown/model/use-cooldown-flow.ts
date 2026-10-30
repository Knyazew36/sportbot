import { useEffect, useRef, useState } from 'react';
import { router, type Href } from 'expo-router';

import { type Cooldown } from '@sportbot/api/entities/workout';
import { cooldownMinutes } from '@sportbot/api/lib/cooldown';
import {
  useCooldownAdd,
  useCooldownFinish,
  useCooldownRoutine,
  useCooldownStart,
  useCooldownSwap,
} from '@/shared/local/entities/workout';
import { useExcludeCooldownStretch } from '@/features/exclude-stretch/useExcludeCooldownStretch';
import { ROUTES } from '@/shared/config/routes';

export type CooldownPhase = { kind: 'overview' } | { kind: 'step'; index: number; side: 1 | 2 } | { kind: 'more' };

export type OpenedStretch = { id: number; name: string };

/**
 * Логика заминки: обзор → растяжки по шагам (по сторонам) → «что дальше?» → итог.
 * Состав с сервера, при повторном открытии не меняется; человек может заменить растяжку или добавить ещё.
 * В статистику идёт только время заминки: начало первой растяжки и выход к итогу.
 * start — пришли с предложения после финиша: сразу первая растяжка
 */
export const useCooldownFlow = (cooldown: Cooldown, start: boolean) => {
  const [phase, setPhase] = useState<CooldownPhase>(
    start ? { kind: 'step', index: 0, side: 1 } : { kind: 'overview' },
  );
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());
  const [listOpen, setListOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [opened, setOpened] = useState<OpenedStretch | null>(null);
  const all = [...cooldown.main, ...cooldown.optional];
  const remaining = all.filter((s) => !done.has(s.id));
  const back = { pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(cooldown.workoutId) } } as Href;
  const { mutate: markStart } = useCooldownStart();
  const { mutate: markFinish } = useCooldownFinish();
  const marked = useRef<{ start?: boolean; finish?: boolean }>({});
  const exclude = useExcludeCooldownStretch();
  const swap = useCooldownSwap();
  const add = useCooldownAdd();
  const routine = useCooldownRoutine();

  // Отметка один раз за открытие; повторное открытие сервер не перезапишет
  useEffect(() => {
    if (phase.kind === 'step' && !marked.current.start) {
      marked.current.start = true;
      markStart(cooldown.workoutId);
    }
  }, [phase.kind, cooldown.workoutId, markStart]);

  // Без промежуточного «Готово» — сразу к итогу, время заминки видно там
  const finish = () => {
    if (marked.current.start && !marked.current.finish) {
      marked.current.finish = true;
      markFinish(cooldown.workoutId);
    }
    router.replace(back);
  };

  const go = (index: number) => setPhase({ kind: 'step', index, side: 1 });

  const next = () => {
    if (phase.kind !== 'step') return;
    const stretch = all[phase.index];
    if (!stretch) return;
    if (stretch.perSide && phase.side === 1) return setPhase({ ...phase, side: 2 });
    setDone((prev) => new Set(prev).add(stretch.id));
    // Конец основного блока и конец всего — развилка: продолжить, добавить или закончить
    if (phase.index === cooldown.main.length - 1 || phase.index === all.length - 1) return setPhase({ kind: 'more' });
    go(phase.index + 1);
  };

  const prev = () => {
    if (phase.kind !== 'step') return;
    if (phase.side === 2) return setPhase({ ...phase, side: 1 });
    if (phase.index > 0) go(phase.index - 1);
  };

  const resume = () => go(all.findIndex((s) => !done.has(s.id)));

  // Замена встаёт на место старой; если замены не нашлось — список короче, номер поправляем
  const settle = (updated: Cooldown) => {
    setOpened(null);
    if (phase.kind !== 'step') return;
    const wasMain = phase.index < cooldown.main.length;
    const length = updated.main.length + updated.optional.length;
    if (phase.index >= length || (wasMain && phase.index >= updated.main.length)) return setPhase({ kind: 'more' });
    setPhase({ kind: 'step', index: phase.index, side: 1 });
  };

  const excludeStretch = (stretchId: number) =>
    exclude.mutate({ workoutId: cooldown.workoutId, stretchId }, { onSuccess: settle });

  const swapStretch = (stretchId: number) =>
    swap.mutate({ workoutId: cooldown.workoutId, stretchId }, { onSuccess: settle });

  const addStretch = (muscleId?: number) =>
    add.mutate({ workoutId: cooldown.workoutId, muscleId }, { onSuccess: () => setAddOpen(false) });

  const pickRoutine = (routineId: number) => routine.mutate({ workoutId: cooldown.workoutId, routineId });

  return {
    cooldown,
    phase,
    all,
    done,
    remaining,
    remainingMinutes: cooldownMinutes(remaining),
    back,
    listOpen,
    setListOpen,
    addOpen,
    setAddOpen,
    opened,
    open: (stretch: OpenedStretch) => setOpened({ id: stretch.id, name: stretch.name }),
    closeOpened: () => setOpened(null),
    excludePending: exclude.isPending,
    excludeStretch,
    swapPending: swap.isPending,
    swapStretch,
    addPending: add.isPending,
    addStretch,
    pickRoutine,
    go,
    next,
    prev,
    resume,
    finish,
  };
};

export type CooldownFlow = ReturnType<typeof useCooldownFlow>;
