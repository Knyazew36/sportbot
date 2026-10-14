import { Share2Icon } from 'lucide-react'

import { useShareWorkout } from '@/entities/workout'
import { Button, type ButtonProps } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type ShareWorkoutButtonProps = {
  workoutId: number
  size?: ButtonProps['size']
  className?: string
}

// Карточку присылает бот: её можно переслать в любой чат, а кнопка в ней откроет страницу результата
export const ShareWorkoutButton = ({ workoutId, size, className }: ShareWorkoutButtonProps) => {
  const share = useShareWorkout()
  return (
    <Button
      variant='outline'
      size={size}
      className={className}
      disabled={share.isPending}
      onClick={() => share.mutate(workoutId)}
    >
      <Share2Icon
        className='size-5'
        strokeWidth={2.5}
      />
      Поделиться
    </Button>
  )
}
