import { View } from 'react-native';
import { BookOpen, Repeat2, TriangleAlert } from 'lucide-react-native';

import { lastText, planText, type WorkoutItem } from '@sportbot/api/entities/workout';
import { useIsOnline } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

type ExerciseCardProps = {
  item: WorkoutItem;
  /** Карточка в ленте суперсета: «A1 из 2» */
  label?: string;
};

export const ExerciseCard = ({ item, label }: ExerciseCardProps) => {
  const last = lastText(item.last, item.measure);
  const online = useIsOnline();
  const offlineClass = online ? undefined : 'opacity-50';
  const eyebrow = [item.done ? 'Сделано' : item.replaced ? 'Замена на сегодня' : null, label, item.draft && 'не проверено']
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="gap-4">
      <View className="gap-1">
        {eyebrow ? (
          <Eyebrow tone="primary" className="mb-1">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Poster size="2xl">{item.name}</Poster>
      </View>

      {item.limitedZones.length > 0 && (
        <ButtonLink
          href={{ pathname: ROUTES.WORKOUT_REPLACE, params: { itemId: String(item.id) } }}
          variant="alert"
          size="sm"
          className={cn('h-auto py-1.5', offlineClass)}
          disabled={!online}
        >
          <TriangleAlert className="size-3.5" />
          нагружает {item.limitedZones.join(', ')} — {online ? 'заменить?' : 'заменить можно при сети'}
        </ButtonLink>
      )}

      <View className="gap-1">
        <Text size="sm">
          <Eyebrow>План </Eyebrow>
          <Poster size="sm">{planText(item.plannedSets, item.repsMin, item.repsMax, item.measure)}</Poster>
        </Text>
        {last ? (
          <Text size="sm">
            <Eyebrow>Прошлый раз </Eyebrow>
            <Poster size="sm" tone="primary">
              {last}
            </Poster>
          </Text>
        ) : null}
      </View>

      <View className="flex-row gap-3">
        <ButtonLink
          // from=workout прячет «В тренировку»: менять программу посреди подхода незачем
          href={{ pathname: ROUTES.EXERCISE, params: { exerciseId: String(item.exerciseId), from: 'workout' } }}
          variant="outline"
          size="sm"
        >
          <BookOpen className="size-3.5" />
          Техника
        </ButtonLink>
        <ButtonLink
          href={{ pathname: ROUTES.WORKOUT_REPLACE, params: { itemId: String(item.id) } }}
          variant="outline"
          size="sm"
          className={offlineClass}
          disabled={!online}
        >
          <Repeat2 className="size-3.5" />
          {online ? 'Заменить' : 'Нужна сеть'}
        </ButtonLink>
      </View>
    </View>
  );
};
