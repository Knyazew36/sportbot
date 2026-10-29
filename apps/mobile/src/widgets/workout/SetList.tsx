import { View } from 'react-native';
import { Clock, Pencil, Plus } from 'lucide-react-native';

import {
  lastSetHint,
  lastSetText,
  restText,
  weightText,
  type WorkoutItem,
  type WorkoutSet,
} from '@sportbot/api/entities/workout';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { clockText, isTimed, type Measure } from '@sportbot/api/lib/measure';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography';

type SetListProps = {
  item: WorkoutItem;
  /** Мера нужна шторке правки: у упражнения на время правится время */
  onEdit: (editing: { set: WorkoutSet; measure: Measure }) => void;
  /** Идущая тренировка: подсказка, с чего начать. В прошедшей подход добавляется формой под списком */
  live?: boolean;
  /** Записать подход без таймера; нет — кнопки под списком нет */
  onAdd?: () => void;
};

// Колонки как grid-cols-[32px_1fr_1fr_40px] фронта: CSS grid в Uniwind нет, поэтому ряды flex с теми же ширинами
const NUMBER_COL = 'w-8 shrink-0';
const VALUE_COL = 'min-w-0 flex-1';
const ACTION_COL = 'w-10 shrink-0 items-end';

// Время подхода и отдых перед ним. Отдых сверх плана выделен: видно, где пересидел
const SetTiming = ({ set }: { set: WorkoutSet }) => {
  const rest = set.restBeforeSeconds;
  if (set.workSeconds === null && rest === null) return null;
  // План показываем, только когда пересидел
  const target = rest !== null && set.restTargetSeconds !== null && rest > set.restTargetSeconds ? set.restTargetSeconds : null;
  return (
    <Text size="xs" tone="muted" className="mt-1.5 pl-8 tabular-nums">
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

// Тот же подход в прошлый раз: сравнить вес и отдых, не открывая историю
const SetPrevious = ({ item, number }: { item: WorkoutItem; number: number }) => {
  const prev = lastSetHint(item.last, number);
  if (!prev) return null;
  return (
    <Text size="xs" tone="muted" className="mt-0.5 pl-8 tabular-nums">
      {`было ${lastSetText(prev, item.measure)}`}
      {prev.restBeforeSeconds !== null ? ` · отдых ${restText(prev.restBeforeSeconds)}` : ''}
    </Text>
  );
};

// Сохранённые подходы упражнения. Подходов может быть больше или меньше плана.
// У упражнения на время одна колонка — время подхода, веса нет
export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => {
  const timed = isTimed(item.measure);
  return (
    <Rise>
      <View className="border-border flex-row border-b-[1.5px] pb-2">
        <Eyebrow tone="faint" className={NUMBER_COL}>
          №
        </Eyebrow>
        {timed ? (
          <Eyebrow tone="faint" className={VALUE_COL}>
            Время
          </Eyebrow>
        ) : (
          <>
            <Eyebrow tone="faint" className={VALUE_COL}>
              Вес
            </Eyebrow>
            <Eyebrow tone="faint" className={VALUE_COL}>
              Повторы
            </Eyebrow>
          </>
        )}
        <View className={ACTION_COL} />
      </View>
      {item.sets.length ? (
        <View>
          {item.sets.map((set) => (
            // У подхода из очереди серверного id ещё нет
            <View key={set.clientId ?? set.id} className="border-border border-b-[1.5px] py-3">
              <View className="flex-row items-center">
                <Poster size="sm" tone="faint" className={NUMBER_COL}>
                  {set.number}
                </Poster>
                {!timed && (
                  <Poster size="xl" className={VALUE_COL} numberOfLines={1}>
                    {weightText(set.weight)}
                    {set.weight > 0 && <Unit> кг</Unit>}
                  </Poster>
                )}
                <View className={`${VALUE_COL} flex-row items-center gap-1.5`}>
                  <Poster size="xl" numeric={timed} numberOfLines={1} className="shrink">
                    {timed ? clockText(set.reps) : set.reps}
                    <Unit> {timed ? 'мин:с' : 'раз'}</Unit>
                  </Poster>
                  {/* Тихая метка вместо бейджа: подход сохранён на телефоне и уйдёт, когда появится сеть.
                      Иконка рядом, а не внутри текста: SVG внутри Text на Android не рисуется */}
                  {set.pending && (
                    <Icon as={Clock} className="text-muted-foreground size-3.5" accessibilityLabel="ждёт отправки" />
                  )}
                </View>
                <View className={ACTION_COL}>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onPress={() => onEdit({ set, measure: item.measure })}
                    accessibilityLabel={`Исправить подход ${set.number}`}
                  >
                    <Icon as={Pencil} className="size-4" />
                  </Button>
                </View>
              </View>
              <SetTiming set={set} />
              {/* В прошедшей тренировке «прошлый раз» может оказаться ей самой — сравниваем только в идущей */}
              {live && <SetPrevious item={item} number={set.number} />}
            </View>
          ))}
        </View>
      ) : (
        <Text size="sm" tone="muted" className="py-4">
          {live ? 'Подходов ещё нет — жми «Начать подход».' : 'Подходов не записано.'}
        </Text>
      )}
      {onAdd && (
        // Обводка и малый размер: запись без таймера — запасной путь, главный остаётся «Начать подход»
        <Button variant="outline" size="sm" block className="mt-4" onPress={onAdd}>
          <Icon as={Plus} className="size-4" strokeWidth={3} />
          Добавить подход вручную
        </Button>
      )}
    </Rise>
  );
};
