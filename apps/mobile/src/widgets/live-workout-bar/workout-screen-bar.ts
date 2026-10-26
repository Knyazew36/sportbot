import { useLayoutEffect, useSyncExternalStore } from 'react';

type ScreenBar = {
  /** Поверх экрана тренировки идёт фокус (отдых, разминка, круг) — полоса ему мешает */
  hidden: boolean;
  /** Касание полосы на экране тренировки разворачивает фокус, а не открывает экран заново */
  onReturn?: () => void;
};

// Полоса одна на всё приложение, а фокус живёт в состоянии экрана тренировки — он сообщает его сюда.
// Обработчик держим отдельно от подписки: он новый каждый рендер и не должен перерисовывать полосу
let hidden = false;
let onReturn: (() => void) | undefined;
const listeners = new Set<() => void>();

const setHidden = (next: boolean) => {
  if (next === hidden) return;
  hidden = next;
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Экран тренировки: что сейчас нужно полосе */
export const useWorkoutScreenBar = (state: ScreenBar) => {
  onReturn = state.onReturn;
  // До отрисовки кадра: иначе при входе с открытым фокусом полоса мелькнёт и уедет
  useLayoutEffect(() => setHidden(state.hidden), [state.hidden]);
  useLayoutEffect(
    () => () => {
      onReturn = undefined;
      setHidden(false);
    },
    [],
  );
};

/** Полоса: скрыта ли она экраном тренировки */
export const useWorkoutScreenHidden = () => useSyncExternalStore(subscribe, () => hidden);

export const returnToWorkoutFocus = () => onReturn?.();
