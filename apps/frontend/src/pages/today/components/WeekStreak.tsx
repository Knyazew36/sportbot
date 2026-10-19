import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useState } from 'react'

import type { DayToday } from '@/entities/day'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { ATTENDANCE_LINK } from '@/widgets/stats/links'

import { StreakDaySheet } from './StreakDaySheet'
import { WeekPager } from './WeekPager'

// Серия и рекорд на чёрной плашке, как в статистике; под ними недели, которые листаются назад
type WeekStreakProps = Pick<DayToday, 'streak' | 'week'> & {
  /** Вход в посещения: нужен, только когда шапки с ним нет — во время тренировки её место занимает живая полоса */
  withAttendance?: boolean
}

export const WeekStreak = ({ streak, week, withAttendance }: WeekStreakProps) => {
  const record = Math.max(streak.best, streak.current)
  const [offset, setOffset] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetDate, setSheetDate] = useState<string | null>(null)

  const openDay = (date: string) => {
    setSheetDate(date)
    setSheetOpen(true)
  }

  return (
    <Rise className='px-gutter'>
      <InkPanel>
        <div className='flex items-end justify-between p-4'>
          <div>
            <Eyebrow
              as='p'
              tone='inverseMuted'
            >
              Серия сейчас
            </Eyebrow>
            <Poster
              size='5xl'
              numeric
              className='mt-2'
            >
              {streak.current}
            </Poster>
          </div>
          <div className='text-right'>
            <Eyebrow
              as='p'
              tone='inverseMuted'
            >
              Рекорд
            </Eyebrow>
            <Poster
              size='5xl'
              numeric
              tone='primary'
              className='mt-2'
            >
              {record}
            </Poster>
          </div>
        </div>
        <WeekPager
          week={week}
          offset={offset}
          onOffsetChange={setOffset}
          onOpenDay={openDay}
        />
        {withAttendance && (
          <Link
            to={ATTENDANCE_LINK}
            className='border-background/20 active:bg-background/10 flex items-center justify-between border-t-[1.5px] px-4 py-2.5'
          >
            <Eyebrow tone='primary'>Посещения и календарь</Eyebrow>
            <ChevronRightIcon className='text-primary size-4' />
          </Link>
        )}
      </InkPanel>
      <StreakDaySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={sheetDate}
      />
    </Rise>
  )
}
