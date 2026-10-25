import { useEffect, useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { Flame } from 'lucide-react-native';

import { type SupersetRound, supersetLabels, type WorkoutItem } from '@sportbot/api/entities/workout';
import { GUTTER } from '@/shared/theme/tokens';
import { ChargeChain } from '@/shared/ui/kit/ChargeChain';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import type { EditingSet } from '@/widgets/workout/EditSetSheet';
import { SetList } from '@/widgets/workout/SetList';

import { ExerciseCard } from './ExerciseCard';

type SupersetScreenProps = {
  round: SupersetRound;
  onEdit: (editing: EditingSet) => void;
  /** Дописать забытый подход одному упражнению */
  onAddSet: (item: WorkoutItem) => void;
};

// Промежуток между карточками ленты
const GAP = 12;

// Экран суперсета: цепочка-пагинация и лента карточек участников. Свайп только смотрит —
// круг всегда начинается с первого упражнения, у которого остались подходы, и лента сама к нему едет
export const SupersetScreen = ({ round, onEdit, onAddSet }: SupersetScreenProps) => {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<WorkoutItem>>(null);
  const labels = supersetLabels(round.members);
  const startId = round.round[0]?.id;
  const startIndex = Math.max(0, round.members.findIndex((e) => e.id === startId));
  const [selected, setSelected] = useState(startIndex);
  // Начало круга сменилось — текущим звеном становится оно (правка состояния при рендере, а не в эффекте)
  const [shownStart, setShownStart] = useState(startId);
  if (startId !== shownStart) {
    setShownStart(startId);
    setSelected(startIndex);
  }
  // Карточка на 92% ширины экрана, как basis-[92%] во фронте: край следующей виден — ясно, что листается
  const card = Math.round((width - GUTTER * 2) * 0.92);
  const step = card + GAP;

  const scrollTo = (index: number) => {
    listRef.current?.scrollToOffset({ offset: index * step, animated: true });
    setSelected(index);
  };

  // После круга и отдыха — к упражнению, с которого начнётся следующий круг
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: startIndex * step, animated: true });
  }, [startIndex, step]);

  return (
    <>
      <Rise className="gap-3">
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Icon as={Flame} className="text-primary size-10 shrink-0" />
            <Poster size="2xl" className="shrink">
              Суперсет {round.letter}
            </Poster>
          </View>
          <Eyebrow tone="primary" className="mb-1.5">
            {round.done ? 'готово' : `круг ${round.number} из ${round.rounds}`}
          </Eyebrow>
        </View>
        <Eyebrow>по кругу без отдыха · отдых после круга</Eyebrow>
        <ChargeChain
          links={round.members.map((e, i) => ({
            label: labels[i]!,
            charge: e.plannedSets ? Math.min(e.sets.length, e.plannedSets) / e.plannedSets : 0,
            state: i === selected ? 'current' : e.sets.length >= e.plannedSets ? 'done' : 'idle',
          }))}
          // Вибрацию на тап даёт сама цепочка
          onPick={scrollTo}
        />
      </Rise>
      {/* Лента во всю ширину экрана: отступ экрана снимаем и возвращаем внутрь ленты */}
      <FlatList
        ref={listRef}
        data={round.members}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        style={{ marginHorizontal: -GUTTER }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: GAP }}
        getItemLayout={(_, index) => ({ length: step, offset: step * index, index })}
        onMomentumScrollEnd={(e) => setSelected(Math.round(e.nativeEvent.contentOffset.x / step))}
        keyExtractor={(e) => String(e.id)}
        renderItem={({ item: e, index: i }) => (
          <View style={{ width: card }} className="border-border gap-5 border-[1.5px] p-4">
            <ExerciseCard item={e} label={`${labels[i]} из ${round.members.length}`} />
            <SetList item={e} onEdit={onEdit} onAdd={() => onAddSet(e)} />
          </View>
        )}
      />
    </>
  );
};
