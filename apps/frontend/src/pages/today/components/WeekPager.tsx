import { addDays, addWeeks, format, isSameMonth, parseISO } from 'date-fns'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'

import { useEffect, useRef } from 'react'

import type { DayToday } from '@/entities/day'
import { useCalendarMonths } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { weekdayShort } from '@/shared/lib/weekdays'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
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

// Клетки на чёрной плашке: тренировка — залитая синим с бумажной тенью, как у кнопки, потому что она нажимается
const CELL: Record<DayMark, string> = {
  done: 'bg-primary border-primary text-primary-foreground shadow-[2px_2px_0_var(--sb-paper)] active:translate-[2px] active:shadow-none',
  skip: 'border-destructive text-destructive',
  pause: 'hatch border-background/25 text-background/60',
  moved: 'border-primary text-primary',
  pending: 'border-primary border-dashed text-primary',
  rest: 'border-transparent text-background/35',
  future: 'border-background/30 text-background/80',
}

const MARK_ICON: Partial<Record<DayMark, typeof CheckIcon>> = { done: CheckIcon, skip: XIcon, pause: PauseIcon }

// Сколько протащить пальцем или как быстро смахнуть, чтобы перелистнуть неделю
const SWIPE_DISTANCE = 48
const SWIPE_VELOCITY = 400

const weekTitle = (offset: number, monday: Date) => {
  if (offset === 0) return 'Эта неделя'
  if (offset === -1) return 'Прошлая неделя'
  const sunday = addDays(monday, 6)
  return isSameMonth(monday, sunday)
    ? `${formatDate(monday, 'd')}–${formatDate(sunday, 'd MMM')}`
    : `${formatDate(monday, 'd MMM')} – ${formatDate(sunday, 'd MMM')}`
}

const monthsOf = (dates: Date[]) => [...new Set(dates.map(d => format(d, 'yyyy-MM')))]

type WeekPagerProps = {
  week: DayToday['week']
  /** 0 — текущая неделя, −1 — прошлая и дальше назад */
  offset: number
  onOffsetChange: (offset: number) => void
  /** Тап по дню с тренировкой */
  onOpenDay: (date: string) => void
}

// Неделя с отметками; свайп вправо — в прошлое без ограничения, вперёд — не дальше текущей
export const WeekPager = ({ week, offset, onOffsetChange, onOpenDay }: WeekPagerProps) => {
  const monday = addWeeks(parseISO(week[0]!.date), offset)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const prevDates = dates.map(d => addWeeks(d, -1))
  // Текущую неделю отдаёт главная, календарь нужен только прошлым
  const calendar = useCalendarMonths(offset === 0 ? [] : monthsOf(dates), monthsOf(prevDates))
  const dragged = useRef(false)
  // Новая неделя въезжает с той стороны, куда листали: назад — слева
  const prevOffset = useRef(offset)
  const from = offset < prevOffset.current ? -48 : 48
  useEffect(() => {
    prevOffset.current = offset
  }, [offset])

  const cells: WeekCell[] =
    offset === 0
      ? week.map(d => ({ ...d, mark: TODAY_MARK[d.mark] }))
      : dates.map(d => {
          const date = format(d, 'yyyy-MM-dd')
          return { date, weekday: d.getDay(), mark: DAY_MARK[calendar.marks.get(date) ?? 'FUTURE'], isToday: false }
        })
  const loading = offset !== 0 && calendar.isPending

  const go = (by: number) => onOffsetChange(Math.min(0, offset + by))

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY
    if (!swipe) return
    // Тянем вправо — открываем то, что левее, то есть прошлое
    if (info.offset.x > 0) go(-1)
    else if (offset < 0) go(1)
  }

  return (
    <div className='border-background/20 border-t-[1.5px] px-4 pt-3 pb-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <Eyebrow
          as='p'
          tone={offset === 0 ? 'primary' : 'inverseMuted'}
        >
          {weekTitle(offset, monday)}
        </Eyebrow>
        <div className='flex gap-2'>
          <Button
            variant='paper'
            size='icon-xs'
            onClick={() => go(-1)}
            aria-label='Прошлая неделя'
          >
            <ChevronLeftIcon strokeWidth={2.5} />
          </Button>
          <Button
            variant='paper'
            size='icon-xs'
            onClick={() => go(1)}
            disabled={offset === 0}
            aria-label='Следующая неделя'
          >
            <ChevronRightIcon strokeWidth={2.5} />
          </Button>
        </div>
      </div>
      <div className='grid grid-cols-7 gap-1.5'>
        {cells.map(c => (
          <Eyebrow
            key={c.weekday}
            as='span'
            size='sm'
            tone={c.isToday ? 'primary' : 'inverseMuted'}
            className='text-center'
          >
            {weekdayShort(c.weekday)}
          </Eyebrow>
        ))}
      </div>
      <AnimatePresence
        mode='popLayout'
        initial={false}
      >
        <motion.ol
          key={offset}
          className='mt-1.5 grid cursor-grab grid-cols-7 gap-1.5 active:cursor-grabbing'
          drag='x'
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.35}
          dragSnapToOrigin
          onDragStart={() => {
            dragged.current = true
          }}
          onDragEnd={handleDragEnd}
          onPointerDown={() => {
            dragged.current = false
          }}
          initial={{ opacity: 0, x: from }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {cells.map(c => {
            const Icon = MARK_ICON[c.mark]
            const label = `${formatDate(c.date, 'd MMMM')}: ${MARK_LABEL[c.mark].toLowerCase()}`
            const content = (
              <>
                <Poster
                  as='span'
                  size='sm'
                  numeric
                  tone='inherit'
                >
                  {formatDate(c.date, 'd')}
                </Poster>
                {Icon && (
                  <Icon
                    className='absolute top-0.5 right-0.5 size-3'
                    strokeWidth={3}
                  />
                )}
              </>
            )
            const cellClass = cn(
              'relative flex h-12 items-center justify-center border-[1.5px] transition-[translate,box-shadow] duration-100',
              loading ? 'border-background/15 animate-pulse' : CELL[c.mark],
              c.isToday && 'ring-attention ring-offset-foreground ring-2 ring-offset-2',
            )
            return (
              <li key={c.date}>
                {c.mark === 'done' && !loading ? (
                  <button
                    type='button'
                    className={cn(cellClass, 'w-full')}
                    aria-label={label}
                    onClick={() => {
                      if (!dragged.current) onOpenDay(c.date)
                    }}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className={cellClass}
                    title={label}
                  >
                    {!loading && content}
                  </div>
                )}
              </li>
            )
          })}
        </motion.ol>
      </AnimatePresence>
    </div>
  )
}
