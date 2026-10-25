import { useStatsSummary } from '@sportbot/api/entities/stats'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'

import { StatsSection } from './StatsSection'
import { StreakPanel } from './StreakPanel'

// Серия и её рекорд (frontend-tz, 12.1): от периода не зависят, поэтому стоят над переключателем.
// Посещаемость за период — отдельным блоком ниже. userId — статистика друга
export const StatsSummarySection = ({ userId }: { userId?: number }) => {
  const summary = useStatsSummary(userId)

  return (
    <QueryScreen
      query={summary}
      rows={1}
    >
      {s => (
        <StatsSection
          title='Серия'
          aside={`эта неделя: ${s.week.done} из ${s.week.planned}`}
          note='Тренировки по расписанию подряд, без пропусков. Пауза серию не обнуляет. Рекорд — самая длинная серия.'
        >
          <StreakPanel
            current={s.currentStreak}
            record={s.bestStreak}
            className=''
          />
        </StatsSection>
      )}
    </QueryScreen>
  )
}
