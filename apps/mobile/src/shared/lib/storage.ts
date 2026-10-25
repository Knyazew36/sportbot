import { createMMKV } from 'react-native-mmkv';

// Быстрое синхронное хранилище: таймеры тренировки, флаги, выбранная палитра.
// Токен сессии тут не храним — только expo-secure-store (Keychain / Keystore)
export const storage = createMMKV({ id: 'sportbot' });

export const storageJson = {
  get: <T>(key: string): T | undefined => {
    const raw = storage.getString(key);
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  set: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
  remove: (key: string) => storage.remove(key),
};
