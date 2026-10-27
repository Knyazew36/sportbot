import { Linking } from 'react-native';
import { toast } from 'sonner-native';

import {
  useStartMessengerLogin,
  type MessengerLoginStart,
  type MessengerProvider,
} from '@sportbot/api/entities/session';

export const MESSENGER_NAME: Record<MessengerProvider, string> = {
  telegram: 'Telegram',
  max: 'MAX',
};

/** Открыть чат с ботом по ссылке входа. Не открылся — на экране ожидания есть повторная кнопка */
export const openMessengerUrl = (provider: MessengerProvider, url: string) =>
  Linking.openURL(url).catch(() => toast.error(`Не удалось открыть ${MESSENGER_NAME[provider]}`));

/**
 * Вход через бота одним тапом: запросить ссылку и сразу открыть мессенджер,
 * без промежуточного экрана со спиннером. onStarted — куда вести экран (ожидание статуса)
 */
export const useOpenMessengerLogin = () => {
  const start = useStartMessengerLogin();

  const open = (provider: MessengerProvider, onStarted: (data: MessengerLoginStart) => void) =>
    start.mutate(provider, {
      onSuccess: (data) => {
        void openMessengerUrl(provider, data.url);
        onStarted(data);
      },
    });

  return {
    open,
    isPending: start.isPending,
    pendingProvider: start.isPending ? start.variables : undefined,
    error: start.error,
  };
};
