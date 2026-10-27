import { View } from 'react-native';
import { router } from 'expo-router';

import { MESSENGER_NAME } from '@/features/messenger-login/use-open-messenger-login';
import { getApiErrorMessage } from '@/shared/api';
import { LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Text } from '@/shared/ui/kit/Typography';

import { useMessengerLoginFlow } from './model/use-messenger-login-flow';

// Ожидание подтверждения: мессенджер уже открыт с экрана входа, здесь поллинг статуса каждые 2 с
// (пауза в фоне, перечитывание при возврате — focusManager). При confirmed токен сохранён — гварды уводят дальше
const MessengerLoginPage = () => {
  const flow = useMessengerLoginFlow();
  const providerName = MESSENGER_NAME[flow.provider];

  return (
    <LayoutAuth
      title={`Вход через ${providerName}`}
      lead="без пароля —"
      description="Подтвердите вход кнопкой в чате с ботом и вернитесь сюда — войдём автоматически."
    >
      <View className="gap-4">
        {flow.startError && <ErrorText>{getApiErrorMessage(flow.startError)}</ErrorText>}
        {flow.state === 'rejected' && <ErrorText>Вход отклонён</ErrorText>}
        {flow.state === 'expired' && <ErrorText>Ссылка устарела — запросите новую</ErrorText>}
        <Text size="sm" tone="muted" className="text-center">
          {flow.state === 'confirmed' ? 'Вход подтверждён…' : 'Ждём подтверждения в чате с ботом…'}
        </Text>
        <Button disabled={!flow.canReopen || flow.isRefreshing} onPress={flow.reopen}>
          Открыть {providerName}
        </Button>
        <Button variant="ghost" loading={flow.isRefreshing} onPress={flow.refresh}>
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
