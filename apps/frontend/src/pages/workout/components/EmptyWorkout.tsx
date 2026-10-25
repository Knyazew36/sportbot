import { ROUTES } from '@/shared/config/paths'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type EmptyWorkoutProps = {
  title: string
  online: boolean
  onDiscard: () => void
}

// В тренировке не осталось упражнений: остаётся только отменить её
export const EmptyWorkout = ({ title, online, onDiscard }: EmptyWorkoutProps) => (
  <Screen
    header={
      <TopBar
        back={ROUTES.TODAY}
        title={title}
      />
    }
    className='px-gutter'
  >
    <ScreenState
      state='empty'
      title='В тренировке нет упражнений'
      description='Добавь упражнения в программе или отмени тренировку.'
      action={
        <Button
          variant='outline'
          // Отмена удаляет тренировку на сервере — без сети её не сделать
          disabled={!online}
          onClick={onDiscard}
        >
          {online ? 'Отменить тренировку' : 'Отменить · нужна сеть'}
        </Button>
      }
    />
  </Screen>
)
