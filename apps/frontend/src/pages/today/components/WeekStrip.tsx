import { addDays, addWeeks, format, isSameMonth, parseISO } from 'date-fns'
import { CheckIcon, PauseIcon, XIcon } from 'lucide-react'

import { type UIEvent, useState } from 'react'

import type { DayToday } from '@/entities/day'
import { useCalendarMonths, usePrefetchStatsDays } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { weekdayShort } from '@/shared/lib/weekdays'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { DAY_MARK, type DayMark, MARK_LABEL } from '@/widgets/stats/marks'

type WeekCell = { date: string; weekday: number; mark: DayMark; isToday: boolean }

// У недели с главной свои отметки: план и отдых вместо «будущего»
const TODAY_MARK: Record<DayToday['week'][number]['mark'], DayMark> = {
  DONE: 'done',
  MISSED: 'skip',
  PAUSED: 'pause',
  PLAN: 'future',
  REST: 'rest',
}

// Цвета клеток — как в календаре посещений; тренировка ещё и с тенью кнопки, потому что открывает шторку
const CELL: Record<DayMark, string> = {
  done: 'border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_var(--sb-ink)] active:translate-[2px] active:shadow-none',
  skip: 'border-foreground/70 text-foreground/70',
  pause: 'hatch border-border text-foreground/60',
  moved: 'border-primary text-primary',
  pending: 'border-primary border-dashed text-primary',
  rest: 'border-transparent text-foreground/35',
  future: 'border-foreground/20 text-foreground/60',
}

const MARK_ICON: Partial<Record<DayMark, typeof CheckIcon>> = { done: CheckIcon, skip: XIcon, pause: PauseIcon }

// Сколько недель дозагружать, когда лента докручена почти до конца
const MORE_WEEKS = 3

const weekTitle = (offset: number, monday: Date) => {
  if (offset === 0) return 'Эта неделя'
  if (offset === -1) return 'Прошлая неделя'
  const sunday = addDays(monday, 6)
  return isSameMonth(monday, sunday)
    ? `${formatDate(monday, 'd')}–${formatDate(sunday, 'd MMM')}`
    : `${formatDate(monday, 'd MMM')} – ${formatDate(sunday, 'd MMM')}`
}

const workoutsText = (count: number) => {
  if (!count) return 'без тренировок'
  const tail = count % 100
  if (count % 10 === 1 && tail !== 11) return `${count} тренировка`
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(tail)) return `${count} тренировки`
  return `${count} тренировок`
}

type WeekCardProps = {
  week: DayToday['week']
  offset: number
  /** Неделя на экране: только её тренировки подгружаем заранее */
  active: boolean
  onOpenDay: (date: string) => void
}

const WeekCard = ({ week, offset, active, onOpenDay }: WeekCardProps) => {
  const monday = addWeeks(parseISO(week[0]!.date), offset)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  // Текущую неделю отдаёт главная, календарь нужен только прошлым
  const calendar = useCalendarMonths(offset === 0 ? [] : [...new Set(dates.map(d => format(d, 'yyyy-MM')))])
  const loading = offset !== 0 && calendar.isPending

  const cells: WeekCell[] =
    offset === 0
      ? week.map(d => ({ ...d, mark: TODAY_MARK[d.mark] }))
      : dates.map(d => {
          const date = format(d, 'yyyy-MM-dd')
          return { date, weekday: d.getDay(), mark: DAY_MARK[calendar.marks.get(date) ?? 'FUTURE'], isToday: false }
        })
  const done = cells.filter(c => c.mark === 'done').map(c => c.date)
  usePrefetchStatsDays(active && !loading ? done : [])

  return (
    <div
      dir='ltr'
      className='dark:bg-card border-foreground w-[calc(100%-1.25rem)] shrink-0 snap-start border-[1.5px] bg-white p-3 text-foreground'
    >
      <div className='mb-3 flex items-baseline justify-between gap-2'>
        <Poster
          as='h3'
          size='sm'
        >
          {weekTitle(offset, monday)}
        </Poster>
        <Eyebrow tone='default'>{loading ? '…' : workoutsText(done.length)}</Eyebrow>
      </div>
      <ol className='grid grid-cols-7 gap-1.5'>
        {cells.map(c => {
          const Icon = MARK_ICON[c.mark]
          const label = `${formatDate(c.date, 'd MMMM')}: ${MARK_LABEL[c.mark].toLowerCase()}`
          const cellClass = cn(
            'relative flex h-16 w-full flex-col items-center justify-center gap-0.5 border-[1.5px] transition-[translate,box-shadow] duration-100',
            loading ? 'bg-foreground/5 animate-pulse border-transparent' : CELL[c.mark],
          )
          const content = !loading && (
            <>
              <span className='text-[10px] leading-none font-medium tracking-[0.08em] uppercase opacity-75'>
                {weekdayShort(c.weekday)}
              </span>
              <Poster
                as='span'
                size='md'
                numeric
                tone='inherit'
              >
                {formatDate(c.date, 'd')}
              </Poster>
              {Icon && (
                <Icon
                  className='absolute top-1 right-1 size-3'
                  strokeWidth={3}
                />
              )}
            </>
          )
          return (
            <li
              key={c.date}
              className='relative'
            >
              {c.mark === 'done' && !loading ? (
                <button
                  type='button'
                  className={cellClass}
                  aria-label={`${label}, открыть`}
                  onClick={() => onOpenDay(c.date)}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={cellClass}
                  title={label}
                >
                  {content}
                </div>
              )}
              {c.isToday && <span className='bg-attention border-foreground absolute -bottom-1 left-1/2 h-2 w-5 -translate-x-1/2 border-[1.5px]' />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type WeekStripProps = {
  week: DayToday['week']
  onOpenDay: (date: string) => void
}

// Лента недель: текущая справа, прошлые выглядывают слева и листаются свайпом без ограничения.
// dir=rtl — лента растёт влево, и дозагрузка старых недель не сдвигает то, что на экране
export const WeekStrip = ({ week, onOpenDay }: WeekStripProps) => {
  const [count, setCount] = useState(MORE_WEEKS)
  const [active, setActive] = useState(0)

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    // В rtl scrollLeft отрицательный — берём модуль
    const scrolled = Math.abs(el.scrollLeft)
    const slide = el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth
    setActive(Math.round(scrolled / (slide + 8)))
    if (scrolled + el.clientWidth > el.scrollWidth - slide) setCount(c => c + MORE_WEEKS)
  }

  return (
    <div
      dir='rtl'
      onScroll={handleScroll}
      className='no-scrollbar px-gutter scroll-px-gutter flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2'
    >
      {Array.from({ length: count }, (_, i) => (
        <WeekCard
          key={i}
          week={week}
          offset={-i}
          active={i === active}
          onOpenDay={onOpenDay}
        />
      ))}
    </div>
  )
}
