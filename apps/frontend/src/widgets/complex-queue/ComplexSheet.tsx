import { CalendarCheckIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { useProfile } from '@sportbot/api/entities/profile'
import { complexLetter, planText, type ProgramComplex } from '@sportbot/api/entities/program'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ComplexSheetProps = {
  /** Открытый комплекс и его место в очереди; null — шторка закрыта */
  complex: { complex: ProgramComplex; index: number } | null
  onClose: () => void
  /** Подсвеченный комплекс: для него кнопка выбора не нужна */
  activeId?: number
  /** Выбор комплекса; без него шторка только показывает состав */
  onPick?: (id: number) => void
  /** Подпись кнопки выбора: на «Сегодня» — на сегодня, в программах — следующий в очереди */
  pickLabel?: string
  /** Своё действие под составом, например «Скопировать к себе»; close закрывает шторку */
  action?: (complex: ProgramComplex, close: () => void) => ReactNode
}

// Состав комплекса из очереди: что в нём за упражнения и сколько подходов, без перехода в редактор
export const ComplexSheet = ({
  complex,
  onClose,
  activeId,
  onPick,
  pickLabel = 'Буду делать сегодня',
  action,
}: ComplexSheetProps) => {
  const c = complex?.complex
  // У комплекса без своей разминки — разминка из профиля, как на старте тренировки
  const profile = useProfile()
  const warmup = c && ((c.warmupMinutes ?? profile.data?.warmupMinutes) || null)
  return (
    <Sheet
      open={complex !== null}
      onOpenChange={open => !open && onClose()}
    >
      <SheetContent>
        {c && complex && (
          <>
            <SheetHeader>
              <Eyebrow>Тренировка {complexLetter(complex.index)}</Eyebrow>
              <SheetTitle>{c.name}</SheetTitle>
              <SheetDescription>
                {pluralize(c.exercises.length, EXERCISE_FORMS)}{c.isNext ? ' · на очереди' : ''}
              </SheetDescription>
            </SheetHeader>
            <div className='min-h-0 overflow-y-auto px-gutter pb-6'>
              {c.exercises.length === 0 && !c.cardioName ? (
                <Text tone='soft'>В тренировке пока нет упражнений — добавь их в редакторе программы.</Text>
              ) : (
                <List>
                  {warmup && (
                    <ListRow
                      // Перед упражнением 01 — нулевым номером
                      lead='00'
                      title='Разминка'
                      trail={
                        <Poster
                          as='span'
                          className='whitespace-nowrap'
                        >
                          {warmup} мин
                        </Poster>
                      }
                    />
                  )}
                  <ExerciseBlocks items={c.exercises}>
                    {(e, i, label) => (
                    <ListRow
                      key={e.id}
                      lead={label ?? String(i + 1).padStart(2, '0')}
                      title={e.name}
                      meta={e.muscles || undefined}
                      trail={
                        <Poster
                          as='span'
                          className='whitespace-nowrap'
                        >
                          {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
                        </Poster>
                      }
                    />
                    )}
                  </ExerciseBlocks>
                  {c.cardioName && (
                    <ListRow
                      lead='+'
                      title={c.cardioName}
                      meta='кардио'
                      trail={
                        c.cardioMinutes ? (
                          <Poster
                            as='span'
                            className='whitespace-nowrap'
                          >
                            {c.cardioMinutes} мин
                          </Poster>
                        ) : undefined
                      }
                    />
                  )}
                </List>
              )}
            </div>
            {action && (
              <SheetFooter className='border-foreground/15 border-t-[1.5px]'>{action(c, onClose)}</SheetFooter>
            )}
            {!action && onPick && c.id !== activeId && (
              <SheetFooter className='border-foreground/15 border-t-[1.5px]'>
                <Button
                  size='lg'
                  className='w-full'
                  onClick={() => {
                    onPick(c.id)
                    onClose()
                  }}
                >
                  <CalendarCheckIcon />
                  {pickLabel}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
