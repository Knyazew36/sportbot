import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { DayToday } from '@/entities/day'
import { complexLetter } from '@/entities/program'
import { formatDate } from '@/shared/lib/format'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

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

// Что дальше: ближайший тренировочный день и комплекс по очереди
export const NextUp = ({ day, label = 'следующая' }: NextUpProps) => {
  const next = day.next
  if (!next) return null
  const index = day.complexes.findIndex(c => c.id === next.complexId)

  return (
    <Rise className='px-gutter'>
      <Eyebrow as='p'>
        {label}
        {next.date ? ` — ${when(next.date, day.date)}` : ''}
      </Eyebrow>
      <List className='mt-2'>
        <ListRow
          title={next.complexName}
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
    </Rise>
  )
}
