import { useSyncExternalStore } from 'react';

import { getAccessToken, subscribeSession } from '@sportbot/api/client';

import { getSessionUserId } from './session-user';

/**
 * Сервер отверг токен, а человек не выходил: аккаунт на телефоне известен (выход стирает его id),
 * база и очередь на месте. Приложение работает офлайн, отправка ждёт входа
 */
export const isSessionExpired = (): boolean => !getAccessToken() && !!getSessionUserId();

export const useSessionExpired = (): boolean => useSyncExternalStore(subscribeSession, isSessionExpired);
