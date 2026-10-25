import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed';
import { LiveDot } from '@/shared/ui/kit/LiveDot';
import { Clock, Eyebrow, Poster } from '@/shared/ui/kit/Typography';

export type FocusSets = {
  /** Крупная цифра: идущий подход, следующий на отдыхе, а при выполненном плане — сделанные */
  number: number;
  done: number;
  planned: number;
  /** Что считаем: подход или круг суперсета */
  unit?: 'подход' | 'круг';
};

// Больше полос не влезает в половину табло на 375px — дальше хватает одной цифры
const MAX_PIPS = 8;

// Сделанные — залитые полосы, текущий — контур акцентом. Полосы, а не точки: перекликаются с дорожками фона
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

// Табло шапки: подход и общее время на равных ячейках — оба читаются с вытянутой руки.
// Разделитель — левой рамкой второй ячейки: divide-* в Uniwind нет
export const FocusScoreboard = ({ sets, startedAt }: { sets: FocusSets; startedAt: string }) => {
  const elapsed = useWorkoutElapsed(startedAt);
  const over = sets.planned > 0 && sets.number > sets.planned;
  const unit = sets.unit ?? 'подход';
  return (
    <View className="border-border flex-row border-[1.5px]">
      <View
        accessible
        accessibilityLabel={`${unit} ${sets.number}${sets.planned > 0 ? ` из ${sets.planned}` : ''}`}
        className="flex-1 gap-2 p-3"
      >
        <View className="h-3 flex-row items-center justify-between gap-2">
          <Eyebrow tone={over ? 'primary' : 'muted'}>{over ? 'сверх плана' : unit}</Eyebrow>
          {!over && sets.planned > 0 && sets.planned <= MAX_PIPS && <SetPips {...sets} />}
        </View>
        <Poster size="xl" tone={over ? 'primary' : 'inherit'}>
          {sets.number}
          {/* Знак плана мельче цифры — 0.42em фронта от кегля xl */}
          {sets.planned > 0 && <Poster className="text-muted-foreground text-[14px] leading-[14px]">{`/${sets.planned}`}</Poster>}
        </Poster>
      </View>
      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Время тренировки ${elapsed}`}
        className="border-border flex-1 gap-2 border-l-[1.5px] p-3"
      >
        <View className="h-3 flex-row items-center gap-1.5">
          <LiveDot />
          <Eyebrow>всего</Eyebrow>
        </View>
        <Clock size="xl">{elapsed}</Clock>
      </View>
    </View>
  );
};
