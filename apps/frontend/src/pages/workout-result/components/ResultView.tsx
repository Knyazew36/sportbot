import { ArrowRightIcon } from 'lucide-react'

import { type SharedWorkout } from '@sportbot/api/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'

import { ResultExercises } from './ResultExercises'
import { ResultHero } from './ResultHero'
import { ResultStats } from './ResultStats'

export const ResultView = ({ workout }: { workout: SharedWorkout }) => (
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
