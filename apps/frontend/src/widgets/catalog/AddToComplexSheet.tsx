import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { pluralize } from '@front-cmdt/utils/pluralize'

import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ComplexOption = { id: number; letter: string; title: string; count: number }

type AddToComplexSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: string
  complexes: ComplexOption[]
  /** Комплекс выбран: шторка закроется, когда промис выполнится */
  onPick: (complexId: number) => Promise<unknown> | void
}

// «Добавить в комплекс» из карточки упражнения: выбор комплекса активной программы (frontend-tz, 11.2).
// Об успехе говорит общий тост мутации — отдельный экран «Добавлено» в шторке не нужен
export const AddToComplexSheet = ({ open, onOpenChange, program, complexes, onPick }: AddToComplexSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>В какую тренировку?</SheetTitle>
        <SheetDescription>{program}</SheetDescription>
      </SheetHeader>
      <div className='px-gutter flex flex-col gap-2 pb-6'>
        {complexes.map(c => (
          <OptionButton
            key={c.id}
            mark={c.letter}
            title={c.title}
            meta={`${pluralize(c.count, EXERCISE_FORMS)}`}
            onClick={() =>
              Promise.resolve(onPick(c.id))
                .then(() => onOpenChange(false))
                // Ошибку уже показал общий тост — шторка остаётся на выборе
                .catch(() => undefined)
            }
          />
        ))}
      </div>
    </SheetContent>
  </Sheet>
)
