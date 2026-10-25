import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Poster, Text } from '@/shared/ui/kit/Typography';
import { ROUTES } from '@/shared/config/routes';

export const FinishPending = () => (
  <Screen
    fullscreen
    header={<TopBar back={() => router.replace(ROUTES.TODAY)} title="Завершение" />}
    className="items-center justify-center gap-4 px-gutter"
  >
    <View className="items-center gap-4">
      <ActivityIndicator size="large" colorClassName="accent-primary" />
      <Poster size="lg" className="text-center">
        Завершаем тренировку
      </Poster>
      <Text tone="muted" className="text-center">
        Подходы и время уже сохранены. Ждём сеть, чтобы засчитать результат.
      </Text>
    </View>
  </Screen>
);
