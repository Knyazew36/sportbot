import { View } from 'react-native';

import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed';
import { LiveDot } from '@/shared/ui/kit/LiveDot';
import { Text } from '@/shared/ui/kit/Typography';

// Время в подписи шапки: без разрядки капса и с равной шириной цифр, иначе строка подрагивает каждую секунду.
// Отдельный компонент, чтобы ежесекундный тик перерисовывал только его, а не весь экран
export const ElapsedInline = ({ startedAt }: { startedAt: string }) => (
  <View className="flex-row items-center gap-1.5">
    <LiveDot />
    <Text size="xs" className="tabular-nums">
      {useWorkoutElapsed(startedAt)}
    </Text>
  </View>
);
