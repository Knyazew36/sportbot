import type { ProgressUnit } from '@sportbot/api/entities/stats'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { ExerciseSessions } from './ExerciseSessions'

type ExerciseHistorySheetProps = {
  /** Упражнение; null — шторка закрыта. Название сразу в шапке, пока история грузится */
  exercise: { id: number; name: string } | null
  unit: ProgressUnit
  onOpenChange: (open: boolean) => void
}

// История упражнения по тренировкам без ухода с экрана: на тренировке свериться, как шло раньше
export const ExerciseHistorySheet = ({ exercise, unit, onOpenChange }: ExerciseHistorySheetProps) => (
  <Sheet
    open={!!exercise}
    onOpenChange={onOpenChange}
  >
    <SheetContent fullHeight>
      <SheetHeader>
        <SheetTitle>История</SheetTitle>
        {exercise && <SheetDescription>{exercise.name}</SheetDescription>}
      </SheetHeader>
      <div className='px-gutter flex min-h-0 flex-1 flex-col overflow-y-auto pb-6'>
        {exercise && (
          <ExerciseSessions
            exerciseId={exercise.id}
            unit={unit}
          />
        )}
      </div>
    </SheetContent>
  </Sheet>
)
