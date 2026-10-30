import { View } from 'react-native';
import { ArrowDown, ArrowUp, Clock, Pencil, Plus } from 'lucide-react-native';

import {
  lastSetHint,
  lastSetText,
  restText,
  weightText,
  type WorkoutItem,
  type WorkoutSet,
} from '@sportbot/api/entities/workout';
import { clockText, isTimed, type Measure } from '@sportbot/api/lib/measure';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { BlockHeading } from '@/shared/ui/kit/ScreenSection';
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

// Колонки как grid-cols-2 фронта: CSS grid в Uniwind нет, поэтому ряды flex с теми же ширинами
const VALUE_COL = 'min-w-0 flex-1';

type SetDetailsProps = {
  item: WorkoutItem;
  set: WorkoutSet;
};

type SetRestProps = SetDetailsProps & {
  live: boolean;
  first: boolean;
};

// Строка между плитками: отдых идёт между подходами, а не внутри них
const SetRest = ({ item, set, live, first }: SetRestProps) => {
  const rest = set.restBeforeSeconds;
  // В прошедшей тренировке «прошлый раз» может оказаться ей самой — сравниваем только в идущей
  const previous = live ? (lastSetHint(item.last, set.number)?.restBeforeSeconds ?? null) : null;
  // Отдыха нет — плитки всё равно не слипаются
  if (rest === null && previous === null) return first ? null : <View className="h-3" />;
  const target = rest === null ? null : set.restTargetSeconds;
  const over = rest !== null && target !== null && rest > target;
  return (
    <View className="flex-row">
      {/* Линия от номера к номеру: подходы читаются одной цепочкой. Над первым подходом соединять не с чем */}
      <View className="w-10 shrink-0 items-center">{!first && <View className="bg-border w-[1.5px] flex-1" />}</View>
      <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-3 px-3 py-2.5">
        <Eyebrow>Отдых</Eyebrow>
        {rest !== null && (
          <Poster size="xs" tone={over ? 'danger' : 'inherit'} className="tabular-nums">
            {restText(rest)}
          </Poster>
        )}
        {target !== null && (
          <Text size="xs" tone="muted" className="tabular-nums">
            {`план ${restText(target)}`}
          </Text>
        )}
        {previous !== null && (
          <Text size="xs" tone="muted" className="tabular-nums">
            {`было ${restText(previous)}`}
          </Text>
        )}
      </View>
    </View>
  );
};

type SetCompareProps = {
  now: number;
  before: number;
  /** Значение прошлого раза строкой */
  text: string;
};

// Значение прошлого раза под текущим. Стрелка — куда сдвинулись; без изменений её нет
const SetCompare = ({ now, before, text }: SetCompareProps) => (
  <View className={cn(VALUE_COL, 'flex-row items-center gap-1')}>
    <Text size="xs" tone="muted" numberOfLines={1} className="shrink tabular-nums">
      {`было ${text}`}
    </Text>
    {now > before && (
      <Icon as={ArrowUp} className="text-positive size-3.5" strokeWidth={3} accessibilityLabel="больше, чем в прошлый раз" />
    )}
    {now < before && (
      <Icon as={ArrowDown} className="text-destructive size-3.5" strokeWidth={3} accessibilityLabel="меньше, чем в прошлый раз" />
    )}
  </View>
);

// Тот же подход в прошлый раз — вторым рядом, под своими колонками
const SetPrevious = ({ item, set }: SetDetailsProps) => {
  const previous = lastSetHint(item.last, set.number);
  if (!previous) return null;
  return (
    <View className="mt-1.5 flex-row gap-x-2">
      {isTimed(item.measure) ? (
        <SetCompare now={set.reps} before={previous.reps} text={lastSetText(previous, item.measure)} />
      ) : (
        <>
          <SetCompare
            now={set.weight}
            before={previous.weight}
            text={previous.weight === 0 ? 'свой вес' : `${weightText(previous.weight)} кг`}
          />
          <SetCompare now={set.reps} before={previous.reps} text={`${previous.reps} раз`} />
        </>
      )}
    </View>
  );
};

// Подвал плитки: сколько длился подход.
// У упражнения на время длительность и есть главное значение плитки — второй раз не повторяем
const SetDuration = ({ item, set }: SetDetailsProps) => {
  if (isTimed(item.measure) || set.workSeconds === null) return null;
  return (
    <View className="border-border flex-row items-baseline gap-3 border-t-[1.5px] px-3 py-1.5">
      <Eyebrow>Работа</Eyebrow>
      <Poster size="xs" className="tabular-nums">
        {clockText(set.workSeconds)}
      </Poster>
    </View>
  );
};

// Сохранённые подходы упражнения: плитки подходов, между ними строки отдыха. Подходов может быть больше или меньше плана.
// У упражнения на время одна колонка — время подхода, веса нет. Единицы стоят при числах, поэтому шапка колонок не нужна
export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => {
  const timed = isTimed(item.measure);
  return (
    // Плитки тяжелее справки над ними: без воздуха сверху блоки слипаются. Подходов нет — отделять нечего
    <Rise className={cn(item.sets.length > 0 && 'mt-20')}>
      {item.sets.length > 0 && (
        <View className="mb-3">
          <BlockHeading title="Подходы" aside={live ? `${item.sets.length} из ${item.plannedSets}` : undefined} />
        </View>
      )}
      {item.sets.length ? (
        <View>
          {item.sets.map((set, index) => (
            // У подхода из очереди серверного id ещё нет
            <View key={set.clientId ?? set.id}>
              <SetRest item={item} set={set} live={live} first={index === 0} />
              <View className="border-border flex-row border-[1.5px]">
                <View className="border-border w-[37px] shrink-0 items-center justify-center border-r-[1.5px]">
                  <Poster size="md" tone="faint">
                    {set.number}
                  </Poster>
                </View>
                <View className="relative min-w-0 flex-1">
                  <View className={cn('py-3 pl-3', timed ? 'pr-12' : 'pr-2')}>
                    <View className="flex-row gap-x-2">
                      {!timed && (
                        <Poster size="xl" className={VALUE_COL} numberOfLines={1}>
                          {weightText(set.weight)}
                          {set.weight > 0 && <Unit> кг</Unit>}
                        </Poster>
                      )}
                      <View className={cn(VALUE_COL, 'flex-row items-center gap-1.5')}>
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
                    </View>
                    {/* В прошедшей тренировке «прошлый раз» может оказаться ей самой — сравниваем только в идущей */}
                    {live && <SetPrevious item={item} set={set} />}
                  </View>
                  {/* Вне рядов: «было» под повторами занимает всю ширину колонки, под кнопку её не отдаём */}
                  <View className="absolute top-2 right-2">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onPress={() => onEdit({ set, measure: item.measure })}
                      accessibilityLabel={`Исправить подход ${set.number}`}
                    >
                      <Icon as={Pencil} className="size-3.5" />
                    </Button>
                  </View>
                  <SetDuration item={item} set={set} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        !live && (
          <Text size="sm" tone="muted" className="py-4">
            Подходов не записано.
          </Text>
        )
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
