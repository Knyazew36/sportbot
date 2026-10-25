import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { useWorkoutSync } from '@sportbot/api/entities/workout';

import { Icon } from '@/shared/ui/kit/Icon';
import { Eyebrow } from '@/shared/ui/kit/Typography';

// Плашка под шапкой: есть ли сеть, сколько действий ждёт отправки
export const SyncStatus = () => {
  const { online, pending, retrying } = useWorkoutSync();
  if (online && pending === 0) return null;

  return (
    <View className="bg-background border-border flex-row items-center justify-center gap-2 border-b-[1.5px] px-gutter py-1.5">
      {!online && <Icon as={WifiOff} className="text-destructive size-4" />}
      <Eyebrow size="sm" tone={online ? 'muted' : 'danger'}>
        {online
          ? retrying
            ? `Сеть есть · ${pending} действий отправляется`
            : `Сеть есть · ${pending} действий в очереди`
          : pending > 0
            ? `Нет сети · ${pending} действий ждёт отправки`
            : 'Нет сети'}
      </Eyebrow>
    </View>
  );
};
