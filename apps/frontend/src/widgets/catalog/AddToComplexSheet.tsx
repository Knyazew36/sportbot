import { CheckIcon } from 'lucide-react'

import { useState } from 'react'

import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ComplexOption = { id: number; letter: string; title: string; count: number }

type AddToComplexSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: string
  program: string
  complexes: ComplexOption[]
  onPick: (complexId: number) => void
}

// «Добавить в комплекс» из карточки упражнения: выбор комплекса активной программы (frontend-tz, 11.2)
export const AddToComplexSheet = ({
  open,
  onOpenChange,
  exercise,
  program,
  complexes,
  onPick,
}: AddToComplexSheetProps) => {
  const [added, setAdded] = useState<number | null>(null)
  const target = complexes.find(c => c.id === added)

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        onOpenChange(next)
        if (!next) setAdded(null)
      }}
    >
      <SheetContent side='bottom'>
        <SheetHeader>
          <SheetTitle>{target ? 'Добавлено' : 'В какой комплекс?'}</SheetTitle>
          <SheetDescription>
            {target
              ? `«${exercise}» — в конце комплекса «${target.title}», 3 × 8–12. Подходы можно поправить в редакторе.`
              : program}
          </SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-2 px-5 pb-6'>
          {target ? (
            <Button
              variant='outline'
              className='w-full'
              onClick={() => onOpenChange(false)}
            >
              <CheckIcon strokeWidth={3} />
              Готово
            </Button>
          ) : (
            complexes.map(c => (
              <OptionButton
                key={c.id}
                mark={c.letter}
                title={c.title}
                meta={`${c.count} упр.`}
                onClick={() => {
                  onPick(c.id)
                  setAdded(c.id)
                }}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
