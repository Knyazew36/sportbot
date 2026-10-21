import { ArrowRightIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useWorkoutSummary, type WorkoutSummary } from '@/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { cn } from '@/shared/lib/utils'
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords'
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming'
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol'

import { CooldownNudge } from './components/CooldownNudge'
import { SummaryHero } from './components/SummaryHero'
import { SummaryStats } from './components/SummaryStats'

const SummaryView = ({ summary }: { summary: WorkoutSummary }) => {
  const counted = summary.status !== 'IN_PROGRESS'
  // Без замера времени (старые тренировки, простой режим) не знаем, была ли заминка — напоминаем
  const cooldownMissed = counted && summary.timing?.cooldownSeconds == null

  return (
    <Screen
      header={
        <ScreenHeader
          title='Финиш'
          aside={summary.complexName}
        />
      }
      footer={
        // Поделиться — главное действие итога: карточка уходит из бота в любой чат
        <StickyFooter className='block'>
          <div className={cn('grid gap-2', counted ? 'grid-cols-2' : 'grid-cols-1')}>
            {counted && (
              <ShareWorkoutButton
                workoutId={summary.workoutId}
                size='lg'
                className='min-w-0 px-3'
              />
            )}
            <ButtonLink
              to={ROUTES.TODAY}
              variant='outline'
              size='lg'
              className='min-w-0 px-3'
            >
              Домой
              <ArrowRightIcon
                className='size-6'
                strokeWidth={2.5}
              />
            </ButtonLink>
          </div>
        </StickyFooter>
      }
    >
      <SummaryHero summary={summary} />

      {/* Рекорды — пик экрана, сразу за серией, а не после сухих цифр */}
      {summary.records.length > 0 && (
        <ScreenSection
          title='Рекорды'
          aside={summary.records.length}
        >
          <WorkoutRecords records={summary.records} />
        </ScreenSection>
      )}

      <SummaryStats summary={summary} />

      {/* Старые тренировки и простой режим без времени подходов — блока нет */}
      {summary.timing && <SummaryTiming timing={summary.timing} />}

      <WorkoutProtocol workoutId={summary.workoutId} />

      {/* Напоминание — последним: итог важнее, а вернуться к заминке можно и после него */}
      {cooldownMissed && <CooldownNudge workoutId={summary.workoutId} />}
    </Screen>
  )
}

// Итог тренировки (frontend-tz, 8.6): время, серия, рекорды, объём, протокол; поделиться — в футере
const SummaryPage = () => {
  const workoutId = Number(useParams().workoutId)
  const summary = useWorkoutSummary(workoutId)

  return <QueryScreen query={summary}>{data => <SummaryView summary={data} />}</QueryScreen>
}

export default SummaryPage
