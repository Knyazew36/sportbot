import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { getApiErrorMessage } from '@/shared/api';
import { LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Text } from '@/shared/ui/kit/Typography';

import {
  useCompleteMessengerLogin,
  useMessengerLoginStatus,
  useStartMessengerLogin,
  type MessengerProvider,
} from '@sportbot/api/entities/session';

const PROVIDER_NAME: Record<MessengerProvider, string> = {
  telegram: 'Telegram',
  max: 'MAX',
};

// Вход через бота: ссылка на чат с ботом + поллинг статуса каждые 2 с (пауза по фону — focusManager).
// При confirmed токен сохранён — гварды уводят на онбординг или «Сегодня»
const MessengerLoginPage = () => {
  const { provider: providerParam } = useLocalSearchParams<{ provider?: string }>();
  const provider: MessengerProvider = providerParam === 'max' ? 'max' : 'telegram';
  const providerName = PROVIDER_NAME[provider];

  const start = useStartMessengerLogin(provider);
  const token = start.data?.token ?? null;
  const status = useMessengerLoginStatus(provider, token);
  const complete = useCompleteMessengerLogin();

  useEffect(() => {
    start.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Ссылка одноразовая: статус confirmed сервер отдаёт один раз — ловим его сразу, не ждём интервал
  useEffect(() => {
    complete(status.data);
  }, [status.data, complete]);

  const state = status.data?.status;

  return (
    <LayoutAuth
      title={`Вход через ${providerName}`}
      description={`Откроем чат с ботом — подтвердите вход кнопкой внутри ${providerName}.`}
    >
      <View className="gap-4">
        {start.isError && <ErrorText>{getApiErrorMessage(start.error)}</ErrorText>}
        {state === 'rejected' && <ErrorText>Вход отклонён</ErrorText>}
        {state === 'expired' && <ErrorText>Ссылка устарела — запросите новую</ErrorText>}
        <Text size="sm" tone="muted" className="text-center">
          {state === 'confirmed' ? 'Вход подтверждён…' : 'Ждём подтверждения в чате с ботом…'}
        </Text>
        <Button
          loading={start.isPending}
          disabled={!start.data}
          onPress={() => start.data && void Linking.openURL(start.data.url)}
        >
          Открыть {providerName}
        </Button>
        <Button
          variant="ghost"
          // Новый токен — новый ключ запроса статуса: старый поллинг сам отключится
          onPress={() => start.mutate()}
        >
          Обновить ссылку
        </Button>
        <Button variant="link" size="sm" onPress={() => router.back()}>
          Назад
        </Button>
      </View>
    </LayoutAuth>
  );
};

export default MessengerLoginPage;
