import { View } from 'react-native';
import { LogIn } from 'lucide-react-native';

import { useSessionExpired } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

// Сервер перестал принимать токен, а человек тренируется дальше: записанное копится на телефоне.
// Без плашки он не узнал бы, что на сервер ничего не уходит
export const SessionExpiredBanner = () => {
  const expired = useSessionExpired();
  if (!expired) return null;

  return (
    <Rise className="px-gutter">
      <View className="border-primary bg-accent gap-3 border-[1.5px] p-4">
        <Eyebrow tone="primary">Сессия закончилась</Eyebrow>
        <Text>Всё записанное хранится на телефоне. Войдите — и оно уйдёт на сервер.</Text>
        <ButtonLink href={ROUTES.LOGIN} variant="alert" size="sm" className="self-start">
          <Icon as={LogIn} className="size-3.5" />
          Войти
        </ButtonLink>
      </View>
    </Rise>
  );
};
