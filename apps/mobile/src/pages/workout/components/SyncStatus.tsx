import { View } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';

import { useWorkoutSync } from '@sportbot/api/entities/workout';
import { Icon } from '@/shared/ui/kit/Icon';
import { Text } from '@/shared/ui/kit/Typography';

// Строка под шапкой тренировки: в зале сеть пропадает, и человек должен видеть, что подходы не потерялись.
// При нормальной сети молчит: подход уходит за доли секунды, мигать строкой незачем
export const SyncStatus = () => {
  const { online, pending, retrying } = useWorkoutSync();
  if (online && !retrying) return null;

  const text = online
    ? `Сеть плохая · отправляем: ${pending}`
    : pending
      ? `Нет сети · ждут отправки: ${pending}`
      : 'Нет сети · подходы сохранятся на телефоне';

  return (
    <View accessibilityRole="alert" className="flex-row items-center gap-1.5 px-gutter">
      <Icon as={online ? RefreshCw : CloudOff} className="text-muted-foreground size-3.5 shrink-0" />
      <Text size="sm" tone="muted" className="shrink">
        {text}
      </Text>
    </View>
  );
};
