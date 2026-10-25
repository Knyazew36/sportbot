import { View } from 'react-native';
import { Clock, Pencil, Plus } from 'lucide-react-native';

import { weightText, type WorkoutItem, type WorkoutSet } from '@sportbot/api/entities/workout';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { clockText, isTimed, type Measure } from '@sportbot/api/lib/measure';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography';

type SetListProps = {
  item: WorkoutItem;
  onEdit: (editing: { set: WorkoutSet; measure: Measure }) => void;
  live?: boolean;
  onAdd?: () => void;
};

const SetTiming = ({ set }: { set: WorkoutSet }) => {
  const rest = set.restBeforeSeconds;
  if (set.workSeconds === null && rest === null) return null;
  const target = rest !== null && set.restTargetSeconds !== null && rest > set.restTargetSeconds ? set.restTargetSeconds : null;
  return (
    <Text size="xs" tone="muted" className="col-span-3 col-start-2 mt-1 tabular-nums">
      {set.workSeconds !== null && formatSeconds(set.workSeconds)}
      {set.workSeconds !== null && rest !== null && ' · '}
      {rest !== null && (
        <Text size="xs" tone={target !== null ? 'danger' : 'muted'}>
          отдых {formatSeconds(rest)}
          {target !== null && ` из ${formatSeconds(target)}`}
        </Text>
      )}
    </Text>
  );
};

export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => {
  const timed = isTimed(item.measure);
  const grid = timed ? 'grid-cols-[32px_1fr_40px]' : 'grid-cols-[32px_1fr_1fr_40px]';
  return (
    <View className="gap-4">
      <View className={cn('border-border grid border-b-[1.5px] pb-2', grid)}>
        <Eyebrow tone="faint">№</Eyebrow>
        {timed ? (
          <Eyebrow tone="faint">Время</Eyebrow>
        ) : (
          <>
            <Eyebrow tone="faint">Вес</Eyebrow>
            <Eyebrow tone="faint">Повторы</Eyebrow>
          </>
        )}
      </View>
      {item.sets.length ? (
        <View>
          {item.sets.map((set) => (
            <View
              key={set.clientId ?? set.id}
              className={cn('border-border grid items-center border-b-[1.5px] py-3', grid)}
            >
              <Poster size="sm" tone="faint">
                {set.number}
              </Poster>
              {!timed && (
                <Poster size="xl">
                  {weightText(set.weight)}
                  {set.weight > 0 && <Unit>кг</Unit>}
                </Poster>
              )}
              <Poster size="xl" numeric={timed}>
                {timed ? clockText(set.reps) : set.reps}
                <Unit>{timed ? 'мин:с' : 'раз'}</Unit>
                {set.pending && (
                  <Icon as={Clock} className="text-muted-foreground ml-1.5 inline size-3.5 align-baseline" />
                )}
              </Poster>
              <Button
                variant="outline"
                size="icon-sm"
                onPress={() => onEdit({ set, measure: item.measure })}
                accessibilityLabel={`Исправить подход ${set.number}`}
              >
                <Icon as={Pencil} className="size-4" />
              </Button>
              <SetTiming set={set} />
            </View>
          ))}
        </View>
      ) : (
        <Text size="sm" tone="muted" className="py-4">
          {live ? 'Подходов ещё нет — жми «Начать подход».' : 'Подходов не записано.'}
        </Text>
      )}
      {onAdd && (
        <Button variant="outline" size="sm" block onPress={onAdd}>
          <Icon as={Plus} className="size-4" strokeWidth={3} />
          Добавить подход вручную
        </Button>
      )}
    </View>
  );
};
