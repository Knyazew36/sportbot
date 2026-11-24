import { storage } from '@/shared/lib/storage';

const USER_ID_KEY = 'session:user-id';
const CONFIRMED_KEY = 'session:user-confirmed';

// id пользователя — для buster персиста: кеш и офлайн-очередь прошлого аккаунта
// не достанутся следующему на этом телефоне. Пишет фича входа после получения профиля
export const getSessionUserId = (): string => storage.getString(USER_ID_KEY) ?? '';

export const setSessionUserId = (userId: string | number): void => {
  storage.set(USER_ID_KEY, String(userId));
};

export const clearSessionUserId = (): void => {
  storage.remove(USER_ID_KEY);
  storage.remove(CONFIRMED_KEY);
};

/**
 * Сохранённый id подтверждён профилем с сервера для нынешнего токена. После нового входа
 * это ещё неизвестно: токен мог получить другой человек, и чужую базу по старому id открывать нельзя
 */
export const isSessionUserConfirmed = (): boolean => storage.getString(CONFIRMED_KEY) === '1';

export const confirmSessionUser = (): void => {
  storage.set(CONFIRMED_KEY, '1');
};

export const unconfirmSessionUser = (): void => {
  storage.remove(CONFIRMED_KEY);
};
