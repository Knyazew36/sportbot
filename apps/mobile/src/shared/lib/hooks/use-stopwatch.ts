import { useEffect, useState } from 'react';

import { local } from '../local';

/** pausedAt — момент паузы; на продолжении startedAt сдвигается на длину паузы, и она не идёт в зачёт */
type StopwatchState = { startedAt: number; pausedAt: number | null } | null;

const read = (key?: string): StopwatchState => {
  if (!key) return null;
  try {
    const raw = local.get(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'number') return parsed ? { startedAt: parsed, pausedAt: null } : null;
    return parsed as StopwatchState;
  } catch {
    return null;
  }
};

const write = (key: string | undefined, state: StopwatchState) => {
  if (!key) return;
  try {
    if (state === null) local.remove(key);
    else local.set(key, JSON.stringify(state));
  } catch {
    // хранилище недоступно — секундомер живёт до перезапуска
  }
};

/**
 * Секундомер от момента старта, а не по тикам: свёрнутое приложение или погасший экран отсчёт не сбивают.
 * С storageKey переживает перезапуск, в том числе на паузе
 */
export const useStopwatch = ({ storageKey }: { storageKey?: string } = {}) => {
  const [state, setState] = useState<StopwatchState>(() => read(storageKey));
  const [now, setNow] = useState(() => Date.now());
  const ticking = state !== null && state.pausedAt === null;

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  const update = (next: StopwatchState) => {
    setState(next);
    setNow(Date.now());
    write(storageKey, next);
  };

  const elapsedMs = state === null ? 0 : Math.max(0, (state.pausedAt ?? now) - state.startedAt);

  return {
    running: state !== null,
    paused: state?.pausedAt != null,
    pausedAt: state?.pausedAt ?? null,
    elapsed: Math.floor(elapsedMs / 1000),
    elapsedMs,
    start: () => update({ startedAt: Date.now(), pausedAt: null }),
    pause: () => {
      if (state && state.pausedAt === null) update({ ...state, pausedAt: Date.now() });
    },
    resume: () => {
      if (state?.pausedAt != null) update({ startedAt: state.startedAt + Date.now() - state.pausedAt, pausedAt: null });
    },
    stop: () => update(null),
  };
};
