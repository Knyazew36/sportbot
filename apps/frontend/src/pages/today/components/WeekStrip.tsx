import { addDays, addWeeks, format, isSameMonth, parseISO } from 'date-fns'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, XIcon } from 'lucide-react'

import { useState } from 'react'

import type { DayToday } from '@/entities/day'
import { useCalendarMonths, usePrefetchStatsDays } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { weekdayShort } from '@/shared/lib/weekdays'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
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

// Клетки на чёрной плашке: те же голоса, что в календаре посещений, но светлым по тёмному.
// Тренировка с тенью кнопки, потому что открывает шторку
const CELL: Record<DayMark, string> = {
  done: 'border-background bg-primary text-primary-foreground shadow-[2px_2px_0_var(--sb-paper)] active:translate-[2px] active:shadow-none',
  skip: 'border-background/70 text-background/70',
  pause: 'border-background/30 bg-background/10 text-background/60',
  moved: 'border-primary text-primary',
  pending: 'border-primary border-dashed text-primary',
  rest: 'border-transparent text-background/35',
  future: 'border-background/25 text-background/60',
}

const MARK_ICON: Partial<Record<DayMark, typeof CheckIcon>> = { done: CheckIcon, skip: XIcon, pause: PauseIcon }

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

type WeekStripProps = {
  week: DayToday['week']
  onOpenDay: (date: string) => void
}

// Неделя чёрной плашкой, как заминка: текущая по умолчанию, прошлые листаются кнопками.
// Свайп убран — в ленте он спорил с прокруткой экрана и прятал, что назад вообще можно
export const WeekStrip = ({ week, onOpenDay }: WeekStripProps) => {
  const [offset, setOffset] = useState(0)

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
  usePrefetchStatsDays(loading ? [] : done)

  return (
    <div className='px-gutter'>
      {/* Раскладка во внутренней обёртке: InkPanel кладёт детей в свой div, и gap на нём до них не доходит */}
      <InkPanel className='mr-1.5 mb-1.5 p-5 shadow-[6px_6px_0_var(--sb-blue)]'>
        <div className='flex flex-col gap-5'>
        <div className='flex items-end justify-between gap-3'>
          <div className='flex min-w-0 flex-col gap-2'>
            <Eyebrow
              as='p'
              tone='inverseMuted'
            >
              {loading ? '…' : workoutsText(done.length)}
            </Eyebrow>
            <Poster
              as='h3'
              size='lg'
              numeric
            >
              {weekTitle(offset, monday)}
            </Poster>
          </div>
          <div className='flex shrink-0 gap-2'>
            <Button
              variant='paper'
              size='icon'
              aria-label='Предыдущая неделя'
              onClick={() => setOffset(o => o - 1)}
            >
              <ChevronLeftIcon
                className='size-5'
                strokeWidth={2.5}
              />
            </Button>
            <Button
              variant='paper'
              size='icon'
              aria-label='Следующая неделя'
              disabled={offset === 0}
              onClick={() => setOffset(o => o + 1)}
            >
              <ChevronRightIcon
                className='size-5'
                strokeWidth={2.5}
              />
            </Button>
          </div>
        </div>
        <ol className='grid grid-cols-7 gap-1.5'>
          {cells.map(c => {
            const Icon = MARK_ICON[c.mark]
            const label = `${formatDate(c.date, 'd MMMM')}: ${MARK_LABEL[c.mark].toLowerCase()}`
            const cellClass = cn(
              'relative flex h-16 w-full flex-col items-center justify-center gap-1.5 border-[1.5px] transition-[translate,box-shadow] duration-100',
              loading ? 'bg-background/10 animate-pulse border-transparent' : CELL[c.mark],
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
                {c.isToday && (
                  <span className='bg-attention border-background absolute -bottom-1 left-1/2 h-2 w-5 -translate-x-1/2 border-[1.5px]' />
                )}
              </li>
            )
          })}
        </ol>
        </div>
      </InkPanel>
    </div>
  )
}
