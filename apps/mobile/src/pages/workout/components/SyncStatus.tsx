import { View } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';

import { useWorkoutSync } from '@/shared/local/entities/workout';
import { Icon } from '@/shared/ui/kit/Icon';
import { Text } from '@/shared/ui/kit/Typography';

// Строка под шапкой тренировки: в зале сеть пропадает, и человек должен видеть, что подходы не потеряются.
// Тренировка уходит на сервер целиком после завершения — счётчик очереди здесь всегда рос бы, его не показываем
export const SyncStatus = () => {
  const { online, retrying } = useWorkoutSync();
  if (online && !retrying) return null;

  const text = online ? 'Сеть плохая · подходы сохранятся на телефоне' : 'Нет сети · подходы сохранятся на телефоне';

  return (
    <View accessibilityRole="alert" className="flex-row items-center gap-1.5 px-gutter">
      <Icon as={online ? RefreshCw : CloudOff} className="text-muted-foreground size-3.5 shrink-0" />
      <Text size="sm" tone="muted" className="shrink">
        {text}
      </Text>
    </View>
  );
};
