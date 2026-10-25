import { storage } from '@/shared/lib/storage';

const USER_ID_KEY = 'session:user-id';

// id пользователя — для buster персиста: кеш и офлайн-очередь прошлого аккаунта
// не достанутся следующему на этом телефоне. Пишет фича входа после получения профиля
export const getSessionUserId = (): string => storage.getString(USER_ID_KEY) ?? '';

export const setSessionUserId = (userId: string | number): void => {
  storage.set(USER_ID_KEY, String(userId));
};

export const clearSessionUserId = (): void => {
  storage.remove(USER_ID_KEY);
};
