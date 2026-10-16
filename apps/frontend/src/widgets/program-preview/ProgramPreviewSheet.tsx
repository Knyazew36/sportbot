import type { ReactNode } from 'react'

import { complexLetter, planText, type ProgramComplex } from '@/entities/program'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

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
}

// Состав программы без ухода с экрана: шаблон на шаге онбординга, программа друга в его профиле.
// Данные приносит вызывающий — шторка ничего не запрашивает
export const ProgramPreviewSheet = ({ program, onOpenChange, note, action }: ProgramPreviewSheetProps) => (
  <Sheet
    open={program != null}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{program?.name ?? 'Программа'}</SheetTitle>
        <SheetDescription>{program?.description || 'Комплексы идут по очереди, по кругу.'}</SheetDescription>
      </SheetHeader>
      <div className='px-gutter flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-2'>
        {program && program.complexes.length === 0 && <Text tone='muted'>Комплексов пока нет.</Text>}
        {program?.complexes.map((c, i) => (
          <section
            key={c.id}
            className='flex flex-col gap-1'
          >
            <Eyebrow>
              {complexLetter(i)} · {c.name}
            </Eyebrow>
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
          </section>
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
