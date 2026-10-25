import { useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Flame } from 'lucide-react-native';

import { type SupersetRound, supersetLabels, type WorkoutItem } from '@sportbot/api/entities/workout';
import type { EditingSet } from '@/widgets/workout/EditSetSheet';
import { Icon } from '@/shared/ui/kit/Icon';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { SetList } from '@/widgets/workout/SetList';

import { ExerciseCard } from './ExerciseCard';

type SupersetScreenProps = {
  round: SupersetRound;
  onEdit: (editing: EditingSet) => void;
  onAddSet: (item: WorkoutItem) => void;
};

export const SupersetScreen = ({ round, onEdit, onAddSet }: SupersetScreenProps) => {
  const listRef = useRef<FlatList>(null);
  const [selected, setSelected] = useState(0);
  const labels = supersetLabels(round.members);
  const startId = round.round[0]?.id;
  const startIndex = Math.max(0, round.members.findIndex((e) => e.id === startId));

  return (
    <View className="gap-5">
      <View className="gap-3">
        <View className="flex-row items-baseline justify-between gap-3">
          <Poster size="2xl" className="flex-row items-center gap-2">
            <Icon as={Flame} className="text-primary size-[0.9em] shrink-0" />
            Суперсет {round.letter}
          </Poster>
          <Eyebrow tone="primary">{round.done ? 'готово' : `круг ${round.number} из ${round.rounds}`}</Eyebrow>
        </View>
        <Eyebrow>по кругу без отдыха · отдых после круга</Eyebrow>
        <View className="flex-row gap-2">
          {round.members.map((e, i) => {
            const done = e.sets.length >= e.plannedSets;
            return (
              <View
                key={e.id}
                className="flex-1 items-center gap-1"
                accessibilityLabel={`${labels[i]}${done ? ', сделано' : i === selected ? ', текущее' : ''}`}
              >
                <View className={`h-1.5 w-full rounded-full ${done ? 'bg-primary' : 'bg-border'}`} />
                <Eyebrow tone={i === selected ? 'primary' : done ? 'muted' : 'faint'}>{labels[i]}</Eyebrow>
              </View>
            );
          })}
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={round.members}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({ length: 320, offset: 320 * index, index })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / 320);
          setSelected(index);
        }}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item: e, index: i }) => (
          <View className="w-[320px] px-1">
            <View className="border-border gap-5 border-[1.5px] p-4">
              <ExerciseCard item={e} label={`${labels[i]} из ${round.members.length}`} />
              <SetList item={e} onEdit={onEdit} onAdd={() => onAddSet(e)} />
            </View>
          </View>
        )}
        keyExtractor={(e) => String(e.id)}
      />
    </View>
  );
};
