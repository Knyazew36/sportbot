import { View } from 'react-native';
import { CloudOff } from 'lucide-react-native';

import type { DayToday } from '@sportbot/api/entities/day';

import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography';

import { WeekStreak } from './WeekStreak';

// Тренировку завершили без сети — порт FinishQueuedDay.tsx: сервер ещё считает её идущей, а человек уже закончил.
// Вместо «Продолжить» — спокойное «засчитается само»
export const FinishQueuedDay = ({ day }: { day: DayToday }) => {
  return (
    <>
      <Rise className="px-gutter">
        <Eyebrow tone="primary">Тренировка завершена</Eyebrow>
        <Lead className="mt-4">засчитаем —</Lead>
        <Poster size="4xl" tone="primary" numberOfLines={2} adjustsFontSizeToFit className="mt-1">
          {day.workout!.complexName}
        </Poster>
        <View className="mt-4 flex-row items-center gap-1.5">
          <Icon as={CloudOff} className="text-muted-foreground size-3.5" />
          <Text size="sm" tone="muted" className="flex-1">
            Сохранится, когда появится сеть. Приложение можно закрыть.
          </Text>
        </View>
      </Rise>
      <WeekStreak week={day.week} />
    </>
  );
};
