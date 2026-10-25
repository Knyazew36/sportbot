import { pluralize } from '@front-cmdt/utils/pluralize'
import { differenceInCalendarDays, parseISO } from 'date-fns'

import { useState } from 'react'

import type { DayToday } from '@sportbot/api/entities/day'
import { complexLetter, useActiveProgram } from '@sportbot/api/entities/program'
import { formatDate } from '@/shared/lib/format'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { ComplexPreviewSheet } from '@/widgets/program-preview/ComplexPreviewSheet'

type NextUpProps = {
  day: DayToday
  /** Начало подписи: «следующая», «после паузы» */
  label?: string
}

const when = (date: string, today: string) => {
  const days = differenceInCalendarDays(parseISO(date), parseISO(today))
  if (days === 1) return `завтра, ${formatDate(date, 'EEEEEE')}`
  return formatDate(date, 'EEEEEE, d MMMM')
}

// Что дальше: ближайший тренировочный день и комплекс по очереди. По нажатию — шторка с составом
export const NextUp = ({ day, label = 'следующая' }: NextUpProps) => {
  const [open, setOpen] = useState(false)
  // Состав есть только в программе целиком — грузим сразу с экраном, чтобы шторка открывалась готовой, без спиннера
  const program = useActiveProgram()
  const next = day.next
  if (!next) return null
  const index = day.complexes.findIndex(c => c.id === next.complexId)
  const heading = `${label}${next.date ? ` — ${when(next.date, day.date)}` : ''}`

  return (
    <Rise className='px-gutter'>
      <Eyebrow as='p'>{heading}</Eyebrow>
      <List className='mt-2'>
        {/* Вся строка открывает шторку: кнопка растянута на строку */}
        <ListRow
          className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
          title={
            <button
              type='button'
              className='text-left after:absolute after:inset-0'
              onClick={() => setOpen(true)}
            >
              {next.complexName}
            </button>
          }
          meta={`${pluralize(next.exerciseCount, EXERCISE_FORMS)} · по очереди`}
          trail={
            index >= 0 && (
              <Poster
                as='span'
                size='2xl'
                tone='faint'
              >
                {complexLetter(index)}
              </Poster>
            )
          }
        />
      </List>
      <ComplexPreviewSheet
        open={open}
        onOpenChange={setOpen}
        title={next.complexName}
        description={heading}
        complex={program.data?.complexes.find(c => c.id === next.complexId)}
        loading={program.isPending}
      />
    </Rise>
  )
}
