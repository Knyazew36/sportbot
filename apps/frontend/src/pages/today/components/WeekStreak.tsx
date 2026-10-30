import { useState } from 'react'

import type { DayToday } from '@sportbot/api/entities/day'
import { Rise } from '@/shared/ui/kit/Reveal'

import { StreakDaySheet } from './StreakDaySheet'
import { WeekStrip } from './WeekStrip'

// Недели с отметками лентой; тренировка открывается шторкой с деталями и «Поделиться»
type WeekStreakProps = Pick<DayToday, 'week'>

export const WeekStreak = ({ week }: WeekStreakProps) => {
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
      <StreakDaySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={sheetDate}
      />
    </Rise>
  )
}
