import { ArrowRightIcon, XIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

import { type DayMark, MARK_LABEL } from './marks'

// Одна раскладка цвета на клетку и её образец в легенде
const MARK_CELL: Record<DayMark, string> = {
  done: 'bg-primary border-primary text-primary-foreground',
  skip: 'border-foreground/70 text-foreground/70',
  pause: 'hatch border-border text-foreground/60',
  moved: 'border-primary text-primary',
  pending: 'border-primary text-primary border-dashed',
  rest: 'text-foreground/35 border-transparent',
  future: 'border-foreground/20 text-foreground/60',
}

const LEGEND: DayMark[] = ['done', 'skip', 'moved', 'pending', 'pause', 'future']

type MonthCalendarProps = {
  month: string
  /** Сколько пустых клеток до первого числа (понедельник — 0) */
  lead: number
  days: { day: number; mark: DayMark }[]
  selected?: number
  onSelect?: (day: number) => void
  /** Детали выбранного дня под календарём */
  children?: ReactNode
}

// Календарь месяца с отметками дней: тренировка, пропуск, перенос, пауза
export const MonthCalendar = ({ month, lead, days, selected, onSelect, children }: MonthCalendarProps) => (
  <ScreenSection
    title='Календарь'
    action={<Poster as='span'>{month}</Poster>}
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
      {days.map(({ day, mark }) => (
        <button
          key={day}
          type='button'
          onClick={() => onSelect?.(day)}
          disabled={!onSelect}
          aria-label={`${day} ${month.toLowerCase()}: ${MARK_LABEL[mark]}`}
          aria-pressed={selected === day}
          className={cn(
            'relative flex aspect-square items-center justify-center border-[1.5px] text-[13px] transition-transform enabled:active:scale-95',
            MARK_CELL[mark],
            mark === 'done' && 'font-display text-[17px] font-bold',
            selected === day && 'ring-foreground ring-offset-background ring-2 ring-offset-2',
          )}
        >
          {day}
          {mark === 'skip' && (
            <XIcon
              className='absolute inset-0 m-auto size-full p-1 opacity-30'
              strokeWidth={1.25}
            />
          )}
          {mark === 'moved' && <ArrowRightIcon className='absolute right-0.5 bottom-0.5 size-2.5' />}
          {mark === 'pending' && <span className='absolute top-0.5 right-1 text-[9px]'>?</span>}
        </button>
      ))}
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
