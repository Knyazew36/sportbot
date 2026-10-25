import { Link } from 'react-router'

import { planText, type Program } from '@sportbot/api/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { OverlayEditor } from '@/widgets/overlay-editor'

// Лимит названия в схеме плашки (render-contract): длинное название обрезаем, а не роняем форму в ошибку
const TITLE_MAX = 60

type OverlaySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: { id: number; name: string }
  /** Активная программа: план упражнения из неё идёт в подпись */
  program?: Program
}

/** План упражнения в программе: «3 × 8–12». Нет в программе — пусто */
const planOf = (exerciseId: number, program?: Program) => {
  const item = program?.complexes.flatMap(c => c.exercises).find(e => e.exerciseId === exerciseId)
  return item ? planText(item.sets, item.repsMin, item.repsMax, item.measure) : ''
}

// Плашка для своего видео с этим упражнением: название и план уже подставлены
export const OverlaySheet = ({ open, onOpenChange, exercise, program }: OverlaySheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Плашка для вашего видео</SheetTitle>
        <SheetDescription>Наложи на свой ролик с упражнением — в CapCut, InShot или монтажке.</SheetDescription>
      </SheetHeader>
      <div className='px-gutter min-h-0 flex-1 overflow-y-auto pt-4 pb-6'>
        {open && (
          <OverlayEditor
            key={exercise.id}
            initial={{ title: exercise.name.slice(0, TITLE_MAX), subtitle: planOf(exercise.id, program) }}
          />
        )}
        <Text
          size='sm'
          tone='muted'
          className='mt-4'
        >
          Файл можно не ждать: закрой шторку — он доделается и пролежит сутки в{' '}
          <Link
            to={ROUTES.ME_EDITOR_FILES}
            className='text-foreground underline underline-offset-4'
          >
            Профиль → Редактор → Мои файлы
          </Link>
          .
        </Text>
      </div>
    </SheetContent>
  </Sheet>
)
