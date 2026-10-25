import { useEffect, useRef, useState } from 'react';
import { router, type Href } from 'expo-router';

import { type Cooldown, useCooldownFinish, useCooldownStart } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';

export type CooldownPhase = { kind: 'overview' } | { kind: 'step'; index: number; side: 1 | 2 } | { kind: 'more' };

export type OpenedStretch = { id: number; name: string };

/**
 * Логика заминки: обзор → растяжки по шагам (по сторонам) → вопрос «есть время ещё?» → итог.
 * Состав и порядок — с сервера, при повторном открытии не меняется. В статистику идёт только время заминки:
 * начало первой растяжки и выход к итогу. start — пришли с предложения после финиша: сразу первая растяжка
 */
export const useCooldownFlow = (cooldown: Cooldown, start: boolean) => {
  const [phase, setPhase] = useState<CooldownPhase>(
    start ? { kind: 'step', index: 0, side: 1 } : { kind: 'overview' },
  );
  const [listOpen, setListOpen] = useState(false);
  const [opened, setOpened] = useState<OpenedStretch | null>(null);
  const all = [...cooldown.main, ...cooldown.optional];
  const back = { pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(cooldown.workoutId) } } as Href;
  const { mutate: markStart } = useCooldownStart();
  const { mutate: markFinish } = useCooldownFinish();
  const marked = useRef<{ start?: boolean; finish?: boolean }>({});

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
    // После основного блока — вопрос, хватит ли времени на остальное
    if (phase.index === cooldown.main.length - 1 && cooldown.optional.length) return setPhase({ kind: 'more' });
    if (phase.index < all.length - 1) return go(phase.index + 1);
    finish();
  };

  const prev = () => {
    if (phase.kind !== 'step') return;
    if (phase.side === 2) return setPhase({ ...phase, side: 1 });
    if (phase.index > 0) go(phase.index - 1);
  };

  return {
    cooldown,
    phase,
    all,
    back,
    listOpen,
    setListOpen,
    opened,
    open: (stretch: OpenedStretch) => setOpened({ id: stretch.id, name: stretch.name }),
    closeOpened: () => setOpened(null),
    go,
    next,
    prev,
    finish,
  };
};

export type CooldownFlow = ReturnType<typeof useCooldownFlow>;
