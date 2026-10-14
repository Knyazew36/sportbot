import { useStatsSummary } from '@/entities/stats'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { Attendance, StreakPanel } from './StreakPanel'

// Посещаемость за неделю и месяц, серия и рекорд (frontend-tz, 12.1). userId — статистика друга
export const StatsSummarySection = ({ userId }: { userId?: number }) => {
  const summary = useStatsSummary(userId)

  return (
    <QueryScreen
      query={summary}
      rows={2}
    >
      {s => (
        <>
          <Attendance
            month={s.month.percent}
            week={s.week.percent}
            weekNote={`${s.week.done} из ${s.week.planned}`}
          />
          <StreakPanel
            current={s.currentStreak}
            record={s.bestStreak}
          />
        </>
      )}
    </QueryScreen>
  )
}
