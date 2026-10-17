import { addMonths, format, getDaysInMonth, parseISO } from 'date-fns'
import { PencilIcon, Trash2Icon } from 'lucide-react'

import { useState } from 'react'

import { type StatsDay, useCalendar, useStatsDay } from '@/entities/stats'
import { useDeleteWorkout } from '@/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { durationText, isTimed, type Measure } from '@/shared/lib/measure'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { DAY_MARK, MARK_LABEL } from './marks'
import { MonthCalendar } from './MonthCalendar'

// «50 × 10, 10, 9» — вес один на все подходы; иначе каждый подход «вес × повторы». Без веса — только повторы,
// на время — «45 с, 50 с»
const setsText = (sets: { weight: number; reps: number }[], measure: Measure) => {
  if (!sets.length) return '—'
  if (isTimed(measure)) return sets.map(s => durationText(s.reps)).join(', ')
  const weights = new Set(sets.map(s => s.weight))
  const reps = sets.map(s => s.reps).join(', ')
  if (weights.size === 1) {
    const [w] = weights
    return w ? `${String(w).replace('.', ',')} × ${reps}` : reps
  }
  return sets.map(s => (s.weight ? `${String(s.weight).replace('.', ',')}×${s.reps}` : s.reps)).join(', ')
}

const DayDetails = ({ day, canFix }: { day: StatsDay; canFix: boolean }) => {
  const remove = useDeleteWorkout()

  return (
    <div className='border-foreground/80 mt-2 flex flex-col gap-3 border-[1.5px] p-4'>
      <div className='flex items-baseline justify-between gap-3'>
        <Poster size='lg'>{formatDate(day.date, 'd MMMM')}</Poster>
        <Eyebrow tone='primary'>{MARK_LABEL[DAY_MARK[day.mark]]}</Eyebrow>
      </div>
      {day.workouts.map(w => (
        <div key={w.id}>
          <div className='mb-2 flex items-center justify-between gap-3'>
            <Text
              size='sm'
              tone='muted'
            >
              {w.complexName}
              {w.unplanned && ' · внеплановая'}
            </Text>
            {/* Подходы правит только хозяин; в простом режиме их нет */}
            {canFix && !w.simple && (
              <ButtonLink
                to={buildPath(ROUTES.WORKOUT_EDIT, { workoutId: w.id })}
                variant='outline'
                size='xs'
              >
                <PencilIcon />
                Исправить
              </ButtonLink>
            )}
          </div>
          <List>
            <ExerciseBlocks items={w.exercises}>
              {e => (
              <ListRow
                key={e.name}
                title={
                  <Text
                    as='span'
                    size='sm'
                    tone={e.done ? 'inherit' : 'muted'}
                  >
                    {e.name}
                  </Text>
                }
                trail={
                  <Poster
                    as='span'
                    size='xs'
                    tone='soft'
                    className='whitespace-nowrap'
                  >
                    {setsText(e.sets, e.measure)}
                  </Poster>
                }
                className='py-2'
              />
              )}
            </ExerciseBlocks>
          </List>
          {/* Делиться и удалять может только хозяин */}
          {canFix && (
            <div className='mt-3 flex flex-wrap gap-2'>
              <ShareWorkoutButton
                workoutId={w.id}
                size='xs'
              />
              <ConfirmAction
                trigger={
                  <Button
                    variant='outline'
                    size='xs'
                  />
                }
                title='Удалить тренировку?'
                description='Подходы пропадут из статистики, а день в календаре станет пропуском.'
                confirmLabel='Удалить'
                onConfirm={() => remove.mutateAsync(w.id)}
              >
                <Trash2Icon />
                Удалить
              </ConfirmAction>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

type CalendarSectionProps = {
  /** Календарь друга — без исправления отметок */
  userId?: number
}

// Календарь месяца с отметками и деталями дня (frontend-tz, 12.3)
export const CalendarSection = ({ userId }: CalendarSectionProps) => {
  // Текущий месяц фиксируем при открытии: дальше него листать некуда
  const [current] = useState(() => format(new Date(), 'yyyy-MM'))
  const [month, setMonth] = useState(current)
  const [selected, setSelected] = useState<string | null>(null)
  const calendar = useCalendar(month, userId)
  const day = useStatsDay(selected, userId)

  const first = parseISO(`${month}-01`)
  // Понедельник — первая колонка
  const lead = (first.getDay() + 6) % 7
  const marks = new Map((calendar.data ?? []).map(d => [d.date, d.mark]))
  const days = Array.from({ length: getDaysInMonth(first) }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`
    return { day: i + 1, mark: DAY_MARK[marks.get(date) ?? 'FUTURE'] }
  })
  const shift = (by: number) => {
    setMonth(format(addMonths(first, by), 'yyyy-MM'))
    setSelected(null)
  }
  const title = formatDate(first, 'LLLL yyyy')

  return (
    <MonthCalendar
      month={title.charAt(0).toUpperCase() + title.slice(1)}
      lead={lead}
      days={days}
      selected={selected ? Number(selected.slice(-2)) : undefined}
      onSelect={d => setSelected(`${month}-${String(d).padStart(2, '0')}`)}
      onPrev={() => shift(-1)}
      onNext={month < current ? () => shift(1) : undefined}
    >
      {selected && (
        <QueryScreen
          query={day}
          rows={2}
          className='mt-2'
        >
          {d => (
            <DayDetails
              day={d}
              canFix={userId == null}
            />
          )}
        </QueryScreen>
      )}
    </MonthCalendar>
  )
}
