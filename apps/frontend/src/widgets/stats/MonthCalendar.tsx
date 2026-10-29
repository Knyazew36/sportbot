import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

import { type DayMark, MARK_LABEL } from './marks'

// Одна раскладка цвета на клетку и её образец в легенде
const MARK_CELL: Record<DayMark, string> = {
  done: 'bg-primary border-foreground text-primary-foreground',
  skip: 'border-foreground/70 text-foreground/70',
  pause: 'hatch border-border text-foreground/60',
  plan: 'border-primary text-primary',
  rest: 'text-foreground/35 border-transparent',
}

const LEGEND: DayMark[] = ['done', 'skip', 'plan', 'pause']

type MonthCalendarProps = {
  month: string
  /** Сколько пустых клеток до первого числа (понедельник — 0) */
  lead: number
  days: { day: number; mark: DayMark }[]
  selected?: number
  onSelect?: (day: number) => void
  /** Детали выбранного дня под календарём */
  children?: ReactNode
  /** Листание месяцев; без них — только название месяца */
  onPrev?: () => void
  onNext?: () => void
}

// Календарь месяца с отметками дней: тренировка, пропуск, тренировочный день, пауза.
// Нажимается только тренировка — у неё тень кнопки, остальные клетки просто показывают отметку
export const MonthCalendar = ({
  month,
  lead,
  days,
  selected,
  onSelect,
  children,
  onPrev,
  onNext,
}: MonthCalendarProps) => (
  <ScreenSection
    title='Календарь'
    action={
      <div className='flex items-center gap-2'>
        {onPrev && (
          <Button
            variant='outline'
            size='icon-sm'
            onClick={onPrev}
            aria-label='Прошлый месяц'
          >
            <ChevronLeftIcon />
          </Button>
        )}
        <Poster as='span'>{month}</Poster>
        {onNext && (
          <Button
            variant='outline'
            size='icon-sm'
            onClick={onNext}
            aria-label='Следующий месяц'
          >
            <ChevronRightIcon />
          </Button>
        )}
      </div>
    }
  >
    <div className='grid grid-cols-7 gap-1.5'>
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
        <Eyebrow
          key={d}
          size='sm'
          className='pb-1 text-center'
        >
          {d}
        </Eyebrow>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <span key={`lead-${i}`} />
      ))}
      {days.map(({ day, mark }) => {
        const label = `${day} ${month.toLowerCase()}: ${MARK_LABEL[mark]}`
        const cellClass = cn(
          'relative flex aspect-square items-center justify-center border-[1.5px] text-[13px]',
          MARK_CELL[mark],
          selected === day && 'ring-foreground ring-offset-background ring-2 ring-offset-2',
        )
        return mark === 'done' && onSelect ? (
          <button
            key={day}
            type='button'
            onClick={() => onSelect(day)}
            aria-label={`${label}, открыть`}
            aria-pressed={selected === day}
            className={cn(
              cellClass,
              'font-display text-[17px] font-bold shadow-[2px_2px_0_var(--sb-ink)] transition-[translate,box-shadow] duration-100 active:translate-[2px] active:shadow-none',
            )}
          >
            {day}
          </button>
        ) : (
          <div
            key={day}
            title={label}
            aria-label={label}
            className={cn(cellClass, mark === 'done' && 'font-display text-[17px] font-bold')}
          >
            {day}
            {mark === 'skip' && (
              <XIcon
                className='absolute inset-0 m-auto size-full p-1 opacity-30'
                strokeWidth={1.25}
              />
            )}
          </div>
        )
      })}
    </div>
    <ul className='mt-1 flex flex-wrap gap-x-4 gap-y-2'>
      {LEGEND.map(m => (
        <Text
          as='li'
          key={m}
          size='2xs'
          tone='soft'
          className='flex items-center gap-1.5'
        >
          <span className={cn('size-3 border-[1.5px]', MARK_CELL[m])} />
          {MARK_LABEL[m]}
        </Text>
      ))}
    </ul>
    {children}
  </ScreenSection>
)
