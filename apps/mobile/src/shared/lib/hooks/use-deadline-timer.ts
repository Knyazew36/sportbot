import { useCallback, useEffect, useRef, useState } from 'react';

import { local } from '../local';

type TimerState =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number; total: number }
  | { status: 'paused'; left: number; total: number };

const read = (key?: string): TimerState => {
  if (!key) return { status: 'idle' };
  try {
    const raw = local.get(key);
    return raw ? (JSON.parse(raw) as TimerState) : { status: 'idle' };
  } catch {
    return { status: 'idle' };
  }
};

const write = (key: string | undefined, state: TimerState) => {
  if (!key) return;
  try {
    if (state.status === 'idle') local.remove(key);
    else local.set(key, JSON.stringify(state));
  } catch {
    // хранилище недоступно — таймер живёт до перезапуска
  }
};

type Options = {
  /** Ключ хранилища: таймер переживает сворачивание и перезапуск */
  storageKey?: string;
  /** Сработает один раз, когда время вышло при открытом приложении */
  onEnd?: () => void;
};

/**
 * Таймер от момента старта, а не по тикам: свёрнутое приложение или погасший экран
 * отсчёт не сбивают. left < 0 — время вышло столько секунд назад
 */
export const useDeadlineTimer = ({ storageKey, onEnd }: Options = {}) => {
  const [state, setState] = useState<TimerState>(() => read(storageKey));
  const [readKey, setReadKey] = useState(storageKey);
  if (readKey !== storageKey) {
    setReadKey(storageKey);
    setState(read(storageKey));
  }
  const [now, setNow] = useState(() => Date.now());
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const update = useCallback(
    (next: TimerState) => {
      endedRef.current = false;
      setState(next);
      setNow(Date.now());
      write(storageKey, next);
    },
    [storageKey],
  );

  const left =
    state.status === 'running'
      ? Math.ceil((state.endsAt - now) / 1000)
      : state.status === 'paused'
        ? state.left
        : 0;

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'running' || left > 0 || endedRef.current) return;
    endedRef.current = true;
    onEndRef.current?.();
  }, [left, state.status]);

  const fraction =
    state.status === 'running'
      ? Math.min(1, Math.max(0, (state.endsAt - now) / (state.total * 1000)))
      : state.status === 'paused' && state.total
        ? state.left / state.total
        : 0;

  return {
    status: state.status,
    left,
    fraction,
    total: state.status === 'idle' ? 0 : state.total,
    start: (seconds: number) => update({ status: 'running', endsAt: Date.now() + seconds * 1000, total: seconds }),
    add: (seconds: number) => {
      if (state.status !== 'running') return;
      const at = Date.now();
      const overdue = Math.max(0, Math.round((at - state.endsAt) / 1000));
      update({ ...state, endsAt: Math.max(state.endsAt, at) + seconds * 1000, total: state.total + overdue + seconds });
    },
    pause: () => {
      if (state.status === 'running') update({ status: 'paused', left: Math.max(left, 0), total: state.total });
    },
    resume: () => {
      if (state.status === 'paused')
        update({ status: 'running', endsAt: Date.now() + state.left * 1000, total: state.total });
    },
    stop: () => update({ status: 'idle' }),
  };
};

/** «02:15» */
export const formatSeconds = (seconds: number) => {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
