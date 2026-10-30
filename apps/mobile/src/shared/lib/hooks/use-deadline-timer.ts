import { useCallback, useEffect, useRef, useState } from 'react';

import { local } from '../local';
import { storage } from '../storage';

export type TimerState =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number; total: number }
  | { status: 'paused'; left: number; total: number };

export const readTimer = (key?: string): TimerState => {
  if (!key) return { status: 'idle' };
  try {
    const raw = local.get(key);
    return raw ? (JSON.parse(raw) as TimerState) : { status: 'idle' };
  } catch {
    return { status: 'idle' };
  }
};

export const writeTimer = (key: string | undefined, state: TimerState) => {
  if (!key) return;
  try {
    if (state.status === 'idle') local.remove(key);
    else local.set(key, JSON.stringify(state));
  } catch {
    // хранилище недоступно — таймер живёт до перезапуска
  }
};

/**
 * Прибавить время идущему отсчёту: от конца или от момента at, если время уже вышло.
 * Пересиженное идёт в total, иначе кольцо прыгнуло бы назад. Не идёт — без изменений
 */
export const addToTimer = (state: TimerState, seconds: number, at: number): TimerState => {
  if (state.status !== 'running') return state;
  const overdue = Math.max(0, Math.round((at - state.endsAt) / 1000));
  return { ...state, endsAt: Math.max(state.endsAt, at) + seconds * 1000, total: state.total + overdue + seconds };
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
  const [state, setState] = useState<TimerState>(() => readTimer(storageKey));
  const [readKey, setReadKey] = useState(storageKey);
  if (readKey !== storageKey) {
    setReadKey(storageKey);
    setState(readTimer(storageKey));
  }
  const [now, setNow] = useState(() => Date.now());
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // Таймер меняют и снаружи: кнопки «+30 с» и «Пропустить» в уведомлении на экране блокировки
  useEffect(() => {
    if (!storageKey) return;
    const listener = storage.addOnValueChangedListener((changed) => {
      if (changed !== storageKey) return;
      endedRef.current = false;
      setState(readTimer(storageKey));
      setNow(Date.now());
    });
    return () => listener.remove();
  }, [storageKey]);

  const update = useCallback(
    (next: TimerState) => {
      endedRef.current = false;
      setState(next);
      setNow(Date.now());
      writeTimer(storageKey, next);
    },
    [storageKey],
  );

  const left =
    state.status === 'running'
      ? Math.ceil((state.endsAt - now) / 1000)
      : state.status === 'paused'
        ? Math.ceil(state.left)
        : 0;
  const leftMs =
    state.status === 'running'
      ? Math.max(0, state.endsAt - now)
      : state.status === 'paused'
        ? state.left * 1000
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
    /** Конец отсчёта, мс; null — отсчёт не идёт */
    endsAt: state.status === 'running' ? state.endsAt : null,
    left,
    fraction,
    total: state.status === 'idle' ? 0 : state.total,
    /** Состояние целиком: снять перед остановкой, чтобы потом вернуть через restore */
    snapshot: state,
    // Время вышло, пока таймер был снят: сигнал конца уже не к месту, повторно onEnd не зовём
    restore: (saved: TimerState) => {
      update(saved);
      endedRef.current = saved.status === 'running' && saved.endsAt <= Date.now();
    },
    /** Ход кольца Ring, пока отсчёт идёт: к нулю ровно к концу */
    sweep: state.status === 'running' ? { to: 0, ms: leftMs } : undefined,
    start: (seconds: number) => update({ status: 'running', endsAt: Date.now() + seconds * 1000, total: seconds }),
    add: (seconds: number) => {
      if (state.status === 'running') update(addToTimer(state, seconds, Date.now()));
    },
    pause: () => {
      // Остаток с долями секунды: целые сдвигали бы кольцо на паузе назад
      if (state.status === 'running')
        update({ status: 'paused', left: Math.max(0, (state.endsAt - Date.now()) / 1000), total: state.total });
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
