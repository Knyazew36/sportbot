import { useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { PROGRESS_UNIT, useProgress } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'
import { statsHome } from '@/widgets/stats/links'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { PERIOD_DAYS, PERIOD_TEXT, usePeriod } from '@/widgets/stats/periods'

import { E1rmCard } from './components/E1rmCard'
import { E1rmSheet } from './components/E1rmSheet'
import { ProgressHeadline } from './components/ProgressHeadline'
import { SessionsSection } from './components/SessionsSection'

// Прогресс одного упражнения: лучший подход, рост за период, график, история тренировок.
// Расчётный 1ПМ — сразу на кнопке, в шторке — как считается и насколько точен. userId — статистика друга
const StatsExercisePage = () => {
  const exerciseId = Number(useParams().exerciseId)
  const userId = Number(useSearchParams()[0].get('userId')) || undefined
  const [period] = usePeriod()
  const progress = useProgress(exerciseId, PERIOD_DAYS[period], userId)
  const [e1rmOpen, setE1rmOpen] = useState(false)
  const [techniqueOpen, setTechniqueOpen] = useState(false)

  return (
    <Screen
      header={
        <TopBar
          back={statsHome(userId, period)}
          title={progress.data?.name ?? 'Упражнение'}
          subtitle='прогресс'
        />
      }
      className='gap-8 pb-10'
    >
      <PeriodBar />
      <QueryScreen
        query={progress}
        isEmpty={d => !d.summary}
        empty={{
          title: 'Пока нечего показать',
          description: 'Прогресс появится после тренировки с записанными подходами.',
        }}
      >
        {d => {
          const unit = PROGRESS_UNIT[d.unit].short
          // На талоне — лучшая оценка за период, а если в периоде не делали — последняя
          const e1rm = d.e1rm?.best ?? d.e1rm?.current
          const e1rmPoints = d.e1rm?.points ?? []
          // Куда идёт оценка за период: последняя тренировка против первой
          const e1rmTrend = e1rmPoints.length > 1 ? e1rmPoints.at(-1)!.value - e1rmPoints[0]!.value : null
          return (
            <>
              <ProgressHeadline
                summary={d.summary!}
                points={d.points}
                periodText={PERIOD_TEXT[period]}
              />
              {e1rm && (
                <div className='px-gutter'>
                  <E1rmCard
                    e1rm={e1rm}
                    label={d.e1rm?.best ? `лучший ${PERIOD_TEXT[period]}` : 'по последней тренировке'}
                    trend={e1rmTrend}
                    periodText={PERIOD_TEXT[period]}
                    onOpen={() => setE1rmOpen(true)}
                  />
                </div>
              )}
              <ScreenSection
                title='График'
                aside={PROGRESS_UNIT[d.unit].aside}
              >
                {d.points.length > 1 ? (
                  <StepChart
                    data={d.points.map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))}
                    unit={unit}
                    className='-mx-2'
                  />
                ) : (
                  <Text
                    size='sm'
                    tone='muted'
                  >
                    За этот период тренировок мало для графика.
                  </Text>
                )}
              </ScreenSection>
              <SessionsSection
                exerciseId={exerciseId}
                unit={d.unit}
                userId={userId}
              />
              <div className='px-gutter'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => setTechniqueOpen(true)}
                >
                  Техника выполнения
                </Button>
              </div>
              <ExerciseSheet
                exercise={techniqueOpen ? { id: exerciseId, name: d.name } : null}
                onOpenChange={setTechniqueOpen}
              />
              {d.e1rm && (
                <E1rmSheet
                  open={e1rmOpen}
                  onOpenChange={setE1rmOpen}
                  e1rm={d.e1rm}
                  periodText={PERIOD_TEXT[period]}
                />
              )}
            </>
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default StatsExercisePage
