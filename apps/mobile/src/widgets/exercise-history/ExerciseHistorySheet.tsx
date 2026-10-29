import type { ProgressUnit } from '@sportbot/api/entities/stats';

import { Sheet } from '@/shared/ui/kit/Sheet';

import { ExerciseSessions } from './ExerciseSessions';

type ExerciseHistorySheetProps = {
  /** Упражнение; null — шторка закрыта. Название сразу в шапке, пока история грузится */
  exercise: { id: number; name: string } | null;
  unit: ProgressUnit;
  onOpenChange: (open: boolean) => void;
};

// История упражнения по тренировкам без ухода с экрана — порт widgets/exercise-history/ExerciseHistorySheet.tsx
export const ExerciseHistorySheet = ({ exercise, unit, onOpenChange }: ExerciseHistorySheetProps) => (
  <Sheet fullHeight open={!!exercise} onOpenChange={onOpenChange} title="История" description={exercise?.name}>
    {exercise ? <ExerciseSessions exerciseId={exercise.id} unit={unit} /> : null}
  </Sheet>
);
