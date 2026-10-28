import { useSyncExternalStore } from 'react';

export type SyncPhase =
  /** Ждёт следующего запуска; прошлый прошёл успешно или ещё не запускался */
  | 'idle'
  | 'syncing'
  /** Сервер недоступен: нет сети или он не ответил */
  | 'offline'
  /** Нет токена — синк ждёт входа */
  | 'signed-out'
  /** Сервер ответил ошибкой */
  | 'error';

export type SyncStatus = {
  phase: SyncPhase;
  /** Текст ошибки для phase = 'error' */
  error?: string;
};

let status: SyncStatus = { phase: 'idle' };
const listeners = new Set<() => void>();

export const setSyncStatus = (next: SyncStatus) => {
  status = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Что синк делает сейчас. Время последнего обмена — в meta базы (useSyncedAt) */
export const useSyncStatus = (): SyncStatus => useSyncExternalStore(subscribe, () => status);
