import { CheckIcon, PauseIcon, XIcon } from 'lucide-react'
import { motion } from 'motion/react'

import type { DayToday } from '@/entities/day'
import { cn } from '@/shared/lib/utils'
import { weekdayShort } from '@/shared/lib/weekdays'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

const CELL: Record<DayToday['week'][number]['mark'], string> = {
  DONE: 'bg-primary border-primary text-primary-foreground',
  MISSED: 'border-destructive/60 text-destructive',
  PAUSED: 'border-foreground/25 text-foreground/50 hatch',
  PLAN: 'border-foreground/25 text-foreground/60',
  REST: 'border-transparent text-foreground/30',
}

const TITLE: Record<DayToday['week'][number]['mark'], string> = {
  DONE: 'тренировка',
  MISSED: 'пропуск',
  PAUSED: 'пауза',
  PLAN: 'тренировочный день',
  REST: 'отдых',
}

// Серия и текущая неделя: до рекорда — дорожка, под ней дни с отметками
export const WeekStreak = ({ streak, week }: Pick<DayToday, 'streak' | 'week'>) => {
  const record = Math.max(streak.best, streak.current)
  const progress = record > 0 ? (streak.current / record) * 100 : 0

  return (
    <Rise className='border-foreground/80 mx-5 border-[1.5px]'>
      <div className='flex items-stretch'>
        <div className='border-foreground/80 flex w-[min(132px,34vw)] shrink-0 flex-col justify-between gap-2 border-r-[1.5px] p-3'>
          <Eyebrow>Серия</Eyebrow>
          <Poster
            as='span'
            size='5xl'
            numeric
            tone='primary'
          >
            {streak.current}
          </Poster>
        </div>
        <div className='flex flex-1 flex-col justify-between gap-3 p-3'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-2'>
            <Text as='span'>дней подряд</Text>
            <Eyebrow>рекорд {record}</Eyebrow>
          </div>
          <div className='border-border relative h-3 border-[1.5px]'>
            <motion.div
              className='sb-halftone bg-accent absolute inset-y-0 left-0'
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.4, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </div>
      </div>
      <ol className='border-foreground/80 grid grid-cols-7 gap-1.5 border-t-[1.5px] p-3'>
        {week.map(d => (
          <li
            key={d.date}
            className={cn(
              'flex h-9 items-center justify-center border-[1.5px] text-[13px]',
              CELL[d.mark],
              d.isToday && 'ring-primary ring-2 ring-offset-1',
            )}
            title={`${weekdayShort(d.weekday)}: ${TITLE[d.mark]}`}
          >
            {d.mark === 'DONE' && (
              <CheckIcon
                className='size-4'
                strokeWidth={3}
              />
            )}
            {d.mark === 'MISSED' && (
              <XIcon
                className='size-4'
                strokeWidth={3}
              />
            )}
            {d.mark === 'PAUSED' && <PauseIcon className='size-3.5' />}
            {(d.mark === 'PLAN' || d.mark === 'REST') && weekdayShort(d.weekday)}
          </li>
        ))}
      </ol>
    </Rise>
  )
}
