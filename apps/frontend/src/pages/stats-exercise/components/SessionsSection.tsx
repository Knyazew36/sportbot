import type { ProgressUnit } from '@sportbot/api/entities/stats'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ExerciseSessions } from '@/widgets/exercise-history/ExerciseSessions'

type SessionsSectionProps = { exerciseId: number; unit: ProgressUnit; userId?: number }

// История тренировок с упражнением на экране статистики
export const SessionsSection = ({ exerciseId, unit, userId }: SessionsSectionProps) => (
  <ScreenSection
    title='История'
    aside='по тренировкам'
  >
    <ExerciseSessions
      exerciseId={exerciseId}
      unit={unit}
      userId={userId}
    />
  </ScreenSection>
)
