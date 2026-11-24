import { useSyncExternalStore } from 'react';

import { getAccessToken, subscribeSession } from '@sportbot/api/client';

import { getSessionUserId, isSessionUserConfirmed } from './session-user';

/**
 * Сервер отверг токен, а человек не выходил: аккаунт на телефоне известен (выход стирает его id),
 * база и очередь на месте. Приложение работает офлайн, отправка ждёт входа
 */
export const isSessionExpired = (): boolean => !getAccessToken() && !!getSessionUserId();

export const useSessionExpired = (): boolean => useSyncExternalStore(subscribeSession, isSessionExpired);

/**
 * Чей аккаунт открыт, по памяти телефона — без запроса профиля. Кеш запросов живёт сутки, а в зал
 * ходят через день: без этого вход в приложение без сети упирался в загрузку профиля.
 * Токена нет (протух) — аккаунт тот же; токен есть — только если профиль уже подтвердил, чей он
 */
const getKnownUserId = (): number | undefined => {
  const id = getSessionUserId();
  if (!id) return undefined;
  if (getAccessToken() && !isSessionUserConfirmed()) return undefined;
  return Number(id);
};

export const useKnownUserId = (): number | undefined => useSyncExternalStore(subscribeSession, getKnownUserId);
