import { Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useDeleteWorkout } from '@sportbot/api/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'


type WorkoutStatsFooterProps = {
  workoutId: number
  /** Куда уйти после удаления */
  back: string
}

// Поделиться карточкой или удалить тренировку из истории
export const WorkoutStatsFooter = ({ workoutId, back }: WorkoutStatsFooterProps) => {
  const navigate = useNavigate()
  const remove = useDeleteWorkout()
  return (
    <StickyFooter className='grid grid-cols-[1fr_auto] gap-2'>
      <ShareWorkoutButton
        workoutId={workoutId}
        size='lg'
      />
      <ConfirmAction
        trigger={
          <Button
            variant='outline'
            size='lg'
            aria-label='Удалить тренировку'
          />
        }
        title='Удалить тренировку?'
        description='Подходы пропадут из статистики, а день в календаре станет пропуском.'
        confirmLabel='Удалить'
        onConfirm={() => remove.mutateAsync(workoutId).then(() => navigate(back, { replace: true }))}
      >
        <Trash2Icon />
      </ConfirmAction>
    </StickyFooter>
  )
}
