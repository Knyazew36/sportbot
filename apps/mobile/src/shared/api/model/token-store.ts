import type { TokenStore } from '@sportbot/api/client';
import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';

// Токен — в Keychain/Keystore, не в MMKV. Sync-API SDK 58 (getItem/setItem) — без копии в памяти,
// но читаем/пишем её сами: clear() удаляет асинхронно, а интерцептор и гварды проверяют токен сразу.
// SecureStore принимает в ключе только буквы, цифры, «.», «-», «_» — с «:» запись молча падала
// и после перезапуска приходилось входить заново
const TOKEN_KEY = 'sportbot.access-token';

// Сбой Keychain глотать нельзя молча: иначе выход после перезапуска не разобрать
const warn = (action: string, error: unknown) => {
  if (__DEV__) console.warn(`[token-store] ${action} не удалось`, error);
};

let cached = readToken();

function readToken(): string | null {
  try {
    return getItem(TOKEN_KEY);
  } catch (error) {
    warn('чтение токена', error);
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
    } catch (error) {
      // в моменте работаем с копией, при перезапуске будет выход
      warn('запись токена', error);
    }
  },
  clear: () => {
    cached = null;
    void deleteItemAsync(TOKEN_KEY).catch((error: unknown) => warn('удаление токена', error));
  },
};
