import type { DayToday } from '@/entities/day'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { complexLetter } from '@/entities/program'

type OtherComplexSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  programName: string | null
  complexes: DayToday['complexes']
  currentId: number
  onPick: (id: number) => void
}

// «Другой комплекс»: до начала тренировки любой комплекс активной программы вместо предложенного (frontend-tz, 8.5)
export const OtherComplexSheet = ({
  open,
  onOpenChange,
  programName,
  complexes,
  currentId,
  onPick,
}: OtherComplexSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>Другой комплекс</SheetTitle>
        <SheetDescription>{programName}. Очередь продолжится с выбранного.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-2 px-5 pb-6'>
        {complexes.map((c, i) => (
          <OptionButton
            key={c.id}
            mark={complexLetter(i)}
            title={c.name}
            meta={`${c.exerciseCount} упр.${c.isNext ? ' · на очереди' : ''}`}
            selected={c.id === currentId}
            onClick={() => {
              onPick(c.id)
              onOpenChange(false)
            }}
          />
        ))}
      </div>
    </SheetContent>
  </Sheet>
)
