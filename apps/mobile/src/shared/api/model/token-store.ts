import type { TokenStore } from '@sportbot/api/client';
import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';

// Токен — в Keychain/Keystore, не в MMKV. Sync-API SDK 58 (getItem/setItem) — без копии в памяти,
// но читаем/пишем её сами: clear() удаляет асинхронно, а интерцептор и гварды проверяют токен сразу
const TOKEN_KEY = 'sportbot:access-token';

let cached = readToken();

function readToken(): string | null {
  try {
    return getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const secureTokenStore: TokenStore = {
  get: () => cached,
  // remember во фронте означает «до закрытия вкладки» — в мобилке не нужен: токен живёт до выхода
  set: (token) => {
    cached = token;
    try {
      setItem(TOKEN_KEY, token);
    } catch {
      // запись в Keychain не удалась — в моменте работаем с копией, при перезапуске будет выход
    }
  },
  clear: () => {
    cached = null;
    void deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  },
};
