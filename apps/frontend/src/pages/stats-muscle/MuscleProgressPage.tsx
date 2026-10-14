import { useParams, useSearchParams } from 'react-router'

import { useMuscleProgress } from '@/entities/stats'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'

import { ExerciseProgressCard } from './components/ExerciseProgressCard'

// Прогресс весов по мышце: упражнения, где она основная. userId в адресе — статистика друга
const MuscleProgressPage = () => {
  const muscleId = Number(useParams().muscleId)
  const userId = Number(useSearchParams()[0].get('userId')) || undefined
  const progress = useMuscleProgress(muscleId, userId)
  const back = userId ? buildPath(ROUTES.FRIEND, { friendId: userId }) : ROUTES.STATS

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={progress.data?.name ?? 'Мышца'}
          subtitle='прогресс весов'
        />
      }
      className='gap-6 pb-10'
    >
      <QueryScreen
        query={progress}
        isEmpty={d => !d.exercises.length}
        empty={{
          title: 'Пока нечего показать',
          description: 'По этой мышце ещё нет подходов с весом.',
        }}
      >
        {d => d.exercises.map(e => (
          <ExerciseProgressCard
            key={e.id}
            exercise={e}
          />
        ))}
      </QueryScreen>
    </Screen>
  )
}

export default MuscleProgressPage
