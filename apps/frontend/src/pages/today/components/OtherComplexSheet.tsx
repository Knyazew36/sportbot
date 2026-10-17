import type { DayToday } from '@/entities/day'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Text } from '@/shared/ui/kit/Typography'
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
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Другой комплекс</SheetTitle>
        <SheetDescription>
          {complexes.length ? `${programName}. Очередь продолжится с выбранного.` : 'Сначала нужен комплекс'}
        </SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-2 px-gutter pb-6'>
        {/* Кнопку не блокируем: без объяснения непонятно, почему она не жмётся */}
        {complexes.length === 0 && (
          <>
            <Text tone='soft'>
              {programName
                ? 'В программе пока нет комплексов — добавь хотя бы один, чтобы было что выбрать.'
                : 'Нет активной программы — выбери или собери её, чтобы было из чего выбрать комплекс.'}
            </Text>
            <ButtonLink
              to={ROUTES.PROGRAMS}
              className='mt-2 w-full'
            >
              К программам
            </ButtonLink>
          </>
        )}
        {complexes.map((c, i) => (
          <OptionButton
            key={c.id}
            mark={complexLetter(i)}
            title={c.name}
            meta={`${pluralize(c.exerciseCount, EXERCISE_FORMS)}${c.isNext ? ' · на очереди' : ''}`}
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
