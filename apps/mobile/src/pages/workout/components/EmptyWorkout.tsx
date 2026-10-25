import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Button } from '@/shared/ui/kit/Button';
import { Poster, Text } from '@/shared/ui/kit/Typography';
import { ROUTES } from '@/shared/config/routes';

export const EmptyWorkout = ({
  title,
  online,
  onDiscard,
}: {
  title: string;
  online: boolean;
  onDiscard: () => void;
}) => (
  <Screen
    fullscreen
    header={<TopBar back={() => router.replace(ROUTES.TODAY)} title={title} />}
    className="px-gutter"
  >
    <View className="flex-1 items-center justify-center gap-4">
      <Poster size="lg" className="text-center">
        В тренировке нет упражнений
      </Poster>
      <Text tone="muted" className="text-center">
        {online
          ? 'В комплексе дня не заданы упражнения. Отмени тренировку — она не засчитается.'
          : 'Нет сети. Подожди связь или отмени тренировку, когда она появится.'}
      </Text>
    </View>
    <Button variant="destructive" block disabled={!online} onPress={onDiscard}>
      Отменить тренировку
    </Button>
  </Screen>
);
