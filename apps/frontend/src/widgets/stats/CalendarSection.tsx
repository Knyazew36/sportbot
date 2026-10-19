import { addMonths, format, getDaysInMonth, parseISO } from 'date-fns'

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { type StatsDay, useCalendar, useStatsDay } from '@/entities/stats'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'

import { DayWorkout } from './DayWorkout'
import { DAY_MARK, MARK_LABEL } from './marks'
import { MonthCalendar } from './MonthCalendar'

const workoutLink = (workoutId: number, month: string) =>
  `${buildPath(ROUTES.STATS_WORKOUT, { workoutId })}?month=${month}`

// Детали дня под календарём: свой день без тренировок (пропуск, отдых) или день друга — с составом тренировок.
// Свои тренировки открываются отдельной страницей, правка и удаление — там
const DayDetails = ({ day }: { day: StatsDay }) => (
    <div className='border-foreground/80 mt-2 flex flex-col gap-3 border-[1.5px] p-4'>
      <div className='flex items-baseline justify-between gap-3'>
        <Poster size='lg'>{formatDate(day.date, 'd MMMM')}</Poster>
        <Eyebrow tone='primary'>{MARK_LABEL[DAY_MARK[day.mark]]}</Eyebrow>
      </div>
      {day.workouts.map(w => (
        <DayWorkout
          key={w.id}
          workout={w}
        />
      ))}
    </div>
)

type CalendarSectionProps = {
  /** Календарь друга — без исправления отметок */
  userId?: number
}

// Календарь месяца с отметками и деталями дня (frontend-tz, 12.3)
export const CalendarSection = ({ userId }: CalendarSectionProps) => {
  // Текущий месяц фиксируем при открытии: дальше него листать некуда
  const [current] = useState(() => format(new Date(), 'yyyy-MM'))
  // Месяц в адресе: со страницы тренировки «Назад» возвращает на тот же месяц
  const [params, setParams] = useSearchParams()
  const month = params.get('month') ?? current
  const setMonth = (next: string) =>
    setParams(
      prev => {
        prev.set('month', next)
        return prev
      },
      { replace: true },
    )
  const [selected, setSelected] = useState<string | null>(null)
  const calendar = useCalendar(month, userId)
  const day = useStatsDay(selected, userId)
  const navigate = useNavigate()
  const own = userId == null
  const workouts = own && day.data?.date === selected ? day.data.workouts : []
  // Свой день с тренировками уходит на свою страницу: одна — сразу на неё, несколько — на разводящую дня.
  // Под календарём остаются только дни без тренировок
  const target = !selected || !workouts.length
    ? null
    : workouts.length === 1
      ? workoutLink(workouts[0]!.id, month)
      : buildPath(ROUTES.STATS_DAY, { date: selected })

  useEffect(() => {
    if (!target) return
    setSelected(null)
    navigate(target)
  }, [target, navigate])

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
            <DayDetails day={d} />
          )}
        </QueryScreen>
      )}
    </MonthCalendar>
  )
}
