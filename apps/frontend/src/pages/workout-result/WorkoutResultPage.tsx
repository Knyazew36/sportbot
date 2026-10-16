import { ArrowRightIcon, LinkIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { type SharedWorkout, useSharedWorkout } from '@/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { getApiErrorStatus } from '@/shared/api/model/api-error'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'

import { ResultExercises } from './components/ResultExercises'
import { ResultHero } from './components/ResultHero'
import { ResultStats } from './components/ResultStats'

const ResultView = ({ workout }: { workout: SharedWorkout }) => (
  <Screen
    header={
      <ScreenHeader
        title='Результат'
        aside={workout.isOwn ? undefined : workout.authorName}
      />
    }
    footer={
      <StickyFooter className='flex flex-wrap justify-end gap-2'>
        {workout.isOwn ? (
          <>
            <ButtonLink
              to={ROUTES.TODAY}
              variant='outline'
              size='lg'
            >
              Домой
            </ButtonLink>
            <ShareWorkoutButton
              workoutId={workout.workoutId}
              size='lg'
            />
          </>
        ) : (
          // Чужой результат открывают из пересланной карточки — зовём тренироваться самому
          <ButtonLink
            to={ROUTES.TODAY}
            size='lg'
          >
            Тренироваться
            <ArrowRightIcon
              className='size-7'
              strokeWidth={2.5}
            />
          </ButtonLink>
        )}
      </StickyFooter>
    }
  >
    <ResultHero workout={workout} />
    <ResultStats workout={workout} />
    <ResultExercises workout={workout} />
  </Screen>
)

// Результат тренировки по ссылке из карточки «Поделиться»: открыть может любой пользователь бота
const WorkoutResultPage = () => {
  const token = useParams().token ?? ''
  const workout = useSharedWorkout(token)

  if (getApiErrorStatus(workout.error) === 404)
    return (
      <ScreenState
        state='empty'
        icon={LinkIcon}
        title='Ссылка устарела'
        description='Этой тренировки больше нет.'
        className='mx-gutter mt-10'
      />
    )

  return <QueryScreen query={workout}>{data => <ResultView workout={data} />}</QueryScreen>
}

export default WorkoutResultPage
