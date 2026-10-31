import { ArrowRightIcon } from 'lucide-react'

import { type WorkoutSummary } from '@sportbot/api/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords'
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming'
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol'

import { CooldownNudge } from './CooldownNudge'
import { SummaryHero } from './SummaryHero'
import { SummaryStats } from './SummaryStats'

export const SummaryView = ({ summary }: { summary: WorkoutSummary }) => {
  const counted = summary.status !== 'IN_PROGRESS'
  // Без замера времени (старые тренировки, простой режим) не знаем, была ли заминка — напоминаем
  const cooldownMissed = counted && summary.timing?.cooldownSeconds == null
  const recordsCount = summary.records.length + (summary.tonnageRecord ? 1 : 0)

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
        // «Поделиться» — квадрат без подписи, «Домой» забирает всё остальное место
        <StickyFooter className='flex-nowrap'>
          {counted && (
            <ShareWorkoutButton
              workoutId={summary.workoutId}
              iconOnly
            />
          )}
          <ButtonLink
            to={ROUTES.TODAY}
            variant='outline'
            size='lg'
            className='min-w-0 flex-1'
          >
            Домой
            <ArrowRightIcon
              className='size-6'
              strokeWidth={2.5}
            />
          </ButtonLink>
        </StickyFooter>
      }
    >
      <SummaryHero summary={summary} />

      {/* Рекорды — пик экрана, сразу за серией, а не после сухих цифр */}
      {recordsCount > 0 && (
        <ScreenSection
          title='Рекорды'
          aside={recordsCount}
        >
          <WorkoutRecords
            records={summary.records}
            tonnageRecord={summary.tonnageRecord && { tonnage: summary.tonnage, previous: summary.tonnageRecord.previous }}
          />
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

// Итог тренировки (frontend-tz, 8.6): время, серия, рекорды, объём, журнал; поделиться — в футере
