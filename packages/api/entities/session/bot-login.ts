import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { setAccessToken } from '../../client';
import { maxControllerLoginStatus, maxControllerStartLogin } from '../../generated/max/max';
import { telegramControllerLoginStatus, telegramControllerStartLogin } from '../../generated/telegram/telegram';
import type { MaxLoginStatusResponseDto, TelegramLoginStatusResponseDto } from '../../generated/model';

// Вход через мессенджеры (MOBILE_TZ.md, раздел 4): start — ссылка на бота, status — поллинг до подтверждения.
// VK появится здесь же после регенерации orval: контроллер на сервере есть, в generated его ещё нет
export type MessengerProvider = 'telegram' | 'max';

export type MessengerLoginStart = { token: string; url: string; expiresAt: number };
export type MessengerLoginStatus =
  | TelegramLoginStatusResponseDto
  | MaxLoginStatusResponseDto;

const startLogin: Record<MessengerProvider, () => Promise<MessengerLoginStart>> = {
  telegram: () => telegramControllerStartLogin(),
  max: () => maxControllerStartLogin(),
};

const statusParams = (token: string) => ({ token });

export const useStartMessengerLogin = (provider: MessengerProvider) =>
  useMutation({ mutationFn: () => startLogin[provider]() });

/** Поллинг статуса входа: refetchInterval ставит экран, пауза по фокусу — focusManager (query-client) */
export const useMessengerLoginStatus = (provider: MessengerProvider, token: string | null) =>
  useQuery({
    queryKey: ['messenger-login', provider, token],
    queryFn: () =>
      provider === 'telegram'
        ? telegramControllerLoginStatus(statusParams(token ?? ''))
        : maxControllerLoginStatus(statusParams(token ?? '')),
    enabled: !!token,
    refetchInterval: 2_000,
    // Код подтверждения не вечный: дальше polling бессмысленен
    retry: false,
  });

/** confirmed → сохранить токен; isNewUser — онбординг сам подхватит по профилю */
export const useCompleteMessengerLogin = () => {
  const queryClient = useQueryClient();
  return (status: MessengerLoginStatus | undefined) => {
    if (status?.status !== 'confirmed' || !status.accessToken) return;
    setAccessToken(status.accessToken);
    void queryClient.invalidateQueries();
  };
};

/** Открыть ссылку на бота и вернуться — сразу опросить статус, не ждать интервал */
export const usePollOnActive = (refetch: () => void, active: boolean) => {
  useEffect(() => {
    if (active) refetch();
  }, [active, refetch]);
};
