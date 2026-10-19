import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useState } from 'react'

import type { DayToday } from '@/entities/day'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { ATTENDANCE_LINK } from '@/widgets/stats/links'

import { StreakDaySheet } from './StreakDaySheet'
import { WeekStrip } from './WeekStrip'

// Недели с отметками лентой; тренировка открывается шторкой с деталями и «Поделиться»
type WeekStreakProps = Pick<DayToday, 'week'> & {
  /** Вход в посещения: нужен, только когда шапки с ним нет — во время тренировки её место занимает живая полоса */
  withAttendance?: boolean
}

export const WeekStreak = ({ week, withAttendance }: WeekStreakProps) => {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetDate, setSheetDate] = useState<string | null>(null)

  const openDay = (date: string) => {
    setSheetDate(date)
    setSheetOpen(true)
  }

  return (
    <Rise>
      <WeekStrip
        week={week}
        onOpenDay={openDay}
      />
      {withAttendance && (
        <Link
          to={ATTENDANCE_LINK}
          className='mx-gutter active:bg-foreground/5 mt-1 flex items-center justify-between py-2'
        >
          <Eyebrow tone='primary'>Посещения и календарь</Eyebrow>
          <ChevronRightIcon className='text-primary size-4' />
        </Link>
      )}
      <StreakDaySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={sheetDate}
      />
    </Rise>
  )
}
