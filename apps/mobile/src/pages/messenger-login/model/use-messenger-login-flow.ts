import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import {
  openMessengerUrl,
  useOpenMessengerLogin,
} from '@/features/messenger-login/use-open-messenger-login';

import {
  useCompleteMessengerLogin,
  useMessengerLoginStatus,
  type MessengerLoginStart,
  type MessengerProvider,
} from '@sportbot/api/entities/session';

type Params = { provider?: string; token?: string; url?: string };

// Ссылку запрашивает экран входа и сразу открывает мессенджер — сюда приходит готовый token.
// Здесь только ожидание статуса и повторные попытки
export const useMessengerLoginFlow = () => {
  const params = useLocalSearchParams<Params>();
  const provider: MessengerProvider = params.provider === 'max' ? 'max' : 'telegram';
  const token = params.token ?? null;
  const url = params.url ?? null;

  const start = useOpenMessengerLogin();
  const status = useMessengerLoginStatus(provider, token);
  const complete = useCompleteMessengerLogin();

  // Новый токен — новый ключ запроса статуса: старый поллинг сам отключится
  const applyStart = (data: MessengerLoginStart) => router.setParams({ token: data.token, url: data.url });

  // Экран открыли без токена (например, по прямой ссылке) — запрашиваем сами
  useEffect(() => {
    if (!token) start.open(provider, applyStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ссылка одноразовая: статус confirmed сервер отдаёт один раз — ловим его сразу, не ждём интервал
  useEffect(() => {
    complete(status.data);
  }, [status.data, complete]);

  return {
    provider,
    state: status.data?.status,
    canReopen: !!url,
    isRefreshing: start.isPending,
    startError: start.error,
    reopen: () => url && void openMessengerUrl(provider, url),
    refresh: () => start.open(provider, applyStart),
  };
};
