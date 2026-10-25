import { router } from 'expo-router';

import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { StateView } from '@/shared/ui/kit/StateView';

// Временная заглушка экрана, пока он не перенесён из Mini App — порт pages/soon.
// Ссылки на него уже ведут с перенесённых экранов, чтобы переход не падал
const SoonPage = () => (
  <Screen fullscreen header={<TopBar title="Спортбот" />}>
    <StateView
      state="empty"
      empty={{
        title: 'Скоро',
        description: 'Экран переносится в приложение. Пока им можно пользоваться в боте.',
        action: router.canGoBack() ? (
          <Button variant="outline" onPress={() => router.back()}>
            Назад
          </Button>
        ) : (
          <ButtonLink href={ROUTES.TODAY} variant="outline" replace>
            На «Сегодня»
          </ButtonLink>
        ),
      }}
    />
  </Screen>
);

export default SoonPage;
