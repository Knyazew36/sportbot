import { storage } from './storage';

// Обёртка над MMKV с тем же API, что у localStorage во фронте: хуки тренировки портируются без правок
export const local = {
  get: (key: string): string | null => {
    try {
      const value = storage.getString(key);
      return value ?? null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      storage.set(key, value);
    } catch {
      // хранилище недоступно — значение живёт до перезапуска
    }
  },
  remove: (key: string): void => {
    try {
      storage.remove(key);
    } catch {
      // нечего удалять
    }
  },
};
