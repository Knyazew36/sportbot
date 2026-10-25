import { View } from 'react-native';

import type { StatsDay } from '@sportbot/api/entities/stats';
import { durationText, isTimed, type Measure } from '@sportbot/api/lib/measure';

import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { Poster, Text } from '@/shared/ui/kit/Typography';

// «50 × 10, 10, 9» — вес один на все подходы; иначе каждый подход «вес × повторы». Без веса — только повторы,
// на время — «45 с, 50 с»
const setsText = (sets: { weight: number; reps: number }[], measure: Measure) => {
  if (!sets.length) return '—';
  if (isTimed(measure)) return sets.map((s) => durationText(s.reps)).join(', ');
  const weights = new Set(sets.map((s) => s.weight));
  const reps = sets.map((s) => s.reps).join(', ');
  if (weights.size === 1) {
    const [w] = weights;
    return w ? `${String(w).replace('.', ',')} × ${reps}` : reps;
  }
  return sets.map((s) => (s.weight ? `${String(s.weight).replace('.', ',')}×${s.reps}` : s.reps)).join(', ');
};

type DayWorkoutProps = { workout: StatsDay['workouts'][number] };

// Одна тренировка дня — порт widgets/stats/DayWorkout.tsx: комплекс и подходы по упражнениям
export const DayWorkout = ({ workout }: DayWorkoutProps) => (
  <View>
    <Text size="sm" tone="muted" className="mb-2">
      {workout.complexName}
      {workout.unplanned && ' · внеплановая'}
    </Text>
    <List>
      <ExerciseBlocks items={workout.exercises}>
        {(e, _i, _label, last) => (
          <ListRow
            key={e.name}
            last={last}
            className="py-2"
            title={
              <Text size="sm" tone={e.done ? 'inherit' : 'muted'}>
                {e.name}
              </Text>
            }
            trail={
              <Poster size="xs" tone="soft" numberOfLines={1}>
                {setsText(e.sets, e.measure)}
              </Poster>
            }
          />
        )}
      </ExerciseBlocks>
    </List>
  </View>
);
