import type { ReactNode } from 'react'

import { complexLetter, planText, type ProgramComplex } from '@/entities/program'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { SET_FORMS } from '@/shared/lib/plural-forms'

export type PreviewProgram = {
  name: string
  description?: string | null
  complexes: ProgramComplex[]
}

type ProgramPreviewSheetProps = {
  program: PreviewProgram | null
  onOpenChange: (open: boolean) => void
  note?: ReactNode
  action?: ReactNode
  /** Состав ещё грузится: шторка уже открыта по строке списка, комплексы подъедут */
  loading?: boolean
}

// Состав программы без ухода с экрана: шаблон на шаге онбординга, программа друга в его профиле.
// Данные приносит вызывающий — шторка ничего не запрашивает
export const ProgramPreviewSheet = ({ program, onOpenChange, note, action, loading }: ProgramPreviewSheetProps) => (
  <Sheet
    open={program != null}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{program?.name ?? 'Программа'}</SheetTitle>
        <SheetDescription>{program?.description || 'Комплексы идут по очереди, по кругу.'}</SheetDescription>
      </SheetHeader>
      <div className='px-gutter flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-2'>
        {loading && (
          <div
            className='flex justify-center py-10'
            aria-busy='true'
            aria-label='Загрузка'
          >
            <Spinner className='text-smoke size-6' />
          </div>
        )}
        {!loading && program && program.complexes.length === 0 && <Text tone='muted'>Комплексов пока нет.</Text>}
        {program?.complexes.map((c, i) => (
          // Дни идут подряд и однотипны — без жирной шапки сливаются в один список.
          // Поля уже даёт шторка, поэтому у секции свои отключены
          <ScreenSection
            key={c.id}
            variant='block'
            className='px-0'
            title={`${complexLetter(i)} · ${c.name}`}
            aside={pluralize(
              c.exercises.reduce((sum, e) => sum + e.sets, 0),
              SET_FORMS,
            )}
          >
            <List>
              {c.exercises.map(e => (
                <ListRow
                  key={e.id}
                  title={e.name}
                  meta={e.muscles}
                  trail={
                    <Poster
                      as='span'
                      size='xs'
                      className='whitespace-nowrap'
                    >
                      {planText(e.sets, e.repsMin, e.repsMax)}
                    </Poster>
                  }
                />
              ))}
            </List>
          </ScreenSection>
        ))}
        {note && (
          <Text
            size='xs'
            tone='muted'
          >
            {note}
          </Text>
        )}
      </div>
      {action && <div className='px-gutter pt-2 pb-6'>{action}</div>}
    </SheetContent>
  </Sheet>
)
