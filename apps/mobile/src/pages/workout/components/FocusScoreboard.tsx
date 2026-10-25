import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed';
import { Digits, Eyebrow, Poster, Suffix } from '@/shared/ui/kit/Typography';

export type FocusSets = {
  number: number;
  done: number;
  planned: number;
  unit?: 'подход' | 'круг';
};

const MAX_PIPS = 8;

const SetPips = ({ done, planned, number }: FocusSets) => (
  <View className="flex-row gap-1">
    {Array.from({ length: planned }, (_, i) => (
      <View
        key={i}
        className={cn(
          'h-3 w-1.5',
          i < done ? 'bg-foreground' : i === number - 1 ? 'border-primary border-[1.5px]' : 'bg-foreground/15',
        )}
      />
    ))}
  </View>
);

export const FocusScoreboard = ({ sets, startedAt }: { sets: FocusSets; startedAt: string }) => {
  const elapsed = useWorkoutElapsed(startedAt);
  const over = sets.planned > 0 && sets.number > sets.planned;
  return (
    <View className="border-border flex-row divide-x-[1.5px] divide-border border-[1.5px]">
      <View className="flex-1 gap-2 p-3">
        <View className="flex h-3 flex-row items-center justify-between gap-2">
          <Eyebrow tone={over ? 'primary' : 'muted'}>{over ? 'сверх плана' : sets.unit ?? 'подход'}</Eyebrow>
          {!over && sets.planned > 0 && sets.planned <= MAX_PIPS && <SetPips {...sets} />}
        </View>
        <Poster size="xl" numeric tone={over ? 'primary' : 'inherit'}>
          <Digits fontSize={34}>{String(sets.number)}</Digits>
          {sets.planned > 0 && (
            <Suffix className="text-muted-foreground ml-0.5">
              /<Digits fontSize={34}>{String(sets.planned)}</Digits>
            </Suffix>
          )}
        </Poster>
      </View>
      <View className="flex-1 gap-2 p-3">
        <View className="flex h-3 flex-row items-center gap-1.5">
          <View className="bg-live h-2 w-2 rounded-full" />
          <Eyebrow>всего</Eyebrow>
        </View>
        <Poster size="xl" numeric>
          <Digits fontSize={34}>{elapsed}</Digits>
        </Poster>
      </View>
    </View>
  );
};
