import { useParams, useSearchParams } from 'react-router'

import { useWorkout, useWorkoutSummary } from '@sportbot/api/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Lead, Poster } from '@/shared/ui/kit/Typography'
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords'
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming'
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol'

import { WorkoutFacts } from './components/WorkoutFacts'
import { WorkoutStatsFooter } from './components/WorkoutStatsFooter'

// Прошедшая тренировка из календаря посещений: что сделано, рекорды того дня, время, протокол.
// В отличие от итога сразу после тренировки здесь нет серии и заминки — только разбор и правка
const StatsWorkoutPage = () => {
  const workoutId = Number(useParams().workoutId)
  const [params] = useSearchParams()
  const month = params.get('month')
  // Пришли с разводящей дня (в тот день тренировок несколько) — туда и возвращаемся
  const day = params.get('day')
  const summary = useWorkoutSummary(workoutId)
  const workout = useWorkout(workoutId)
  // Назад — на разводящую дня или в посещения на тот же месяц календаря
  const back = day
    ? buildPath(ROUTES.STATS_DAY, { date: day })
    : `${ROUTES.STATS}?tab=attendance${month ? `&month=${month}` : ''}`

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={summary.data?.complexName ?? 'Тренировка'}
          subtitle={workout.data ? formatDate(workout.data.date, 'EEEE, d MMMM') : undefined}
        />
      }
      footer={
        summary.data && (
          <WorkoutStatsFooter
            workoutId={workoutId}
            back={back}
          />
        )
      }
      className='gap-8 pb-10'
    >
      <QueryScreen query={summary}>
        {s => (
          <>
            <Rise className='px-gutter'>
              <Lead>тренировка</Lead>
              <Poster
                as='h1'
                size='3xl'
                tone='primary'
                fit
              >
                {workout.data ? formatDate(workout.data.date, 'd MMMM') : s.complexName}
              </Poster>
            </Rise>

            <WorkoutFacts
              summary={s}
              // Те же day/month — правка вернёт сюда же, а отсюда — туда, откуда пришли
              editTo={`${buildPath(ROUTES.WORKOUT_EDIT, { workoutId })}?${params.toString()}`}
            />

            {s.records.length > 0 && (
              <ScreenSection
                title='Рекорды'
                aside={s.records.length}
              >
                <WorkoutRecords records={s.records} />
              </ScreenSection>
            )}

            {s.timing && <SummaryTiming timing={s.timing} />}

            <WorkoutProtocol workoutId={workoutId} />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StatsWorkoutPage
