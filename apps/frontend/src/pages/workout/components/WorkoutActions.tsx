import { ArrowRightIcon, PlayIcon, PlusIcon, SkipForwardIcon, TimerIcon } from 'lucide-react'

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { Digits } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export type NextMode = 'skip' | 'next' | 'finish'

type WorkoutActionsProps = {
  /** План по подходам выполнен — главным становится переход дальше */
  planDone: boolean
  /** null — переходить некуда: единственное упражнение без подходов */
  next: NextMode | null
  nextPending: boolean
  /** Отдых вручную — когда он не стартует сам после подхода; null — кнопки нет */
  restSeconds: number | null
  onStartSet: () => void
  onManualSet: () => void
  onRest: () => void
  onNext: () => void
}

export const NEXT_LABEL: Record<NextMode, string> = {
  skip: 'Пропустить упражнение',
  next: 'Следующее упражнение',
  finish: 'Завершить тренировку',
}

// Низ экрана упражнения: подход и переход дальше. Переход всегда активен и подписан тем, что сделает
export const WorkoutActions = ({
  planDone,
  next,
  nextPending,
  restSeconds,
  onStartSet,
  onManualSet,
  onRest,
  onNext,
}: WorkoutActionsProps) => {
  const start = (
    <div className='flex gap-3'>
      {/* План выполнен — подход не главный: лишний подход только осознанно, а не по привычке нажать синюю */}
      <Button
        variant={planDone ? 'outline' : 'default'}
        size='lg'
        className='flex-1'
        onClick={onStartSet}
      >
        {planDone ? <PlusIcon strokeWidth={3} /> : <PlayIcon className='size-6' />}
        {planDone ? 'Ещё подход' : 'Начать подход'}
      </Button>
      {restSeconds !== null && (
        <Button
          variant='outline'
          size='lg'
          onClick={onRest}
          aria-label='Начать отдых'
        >
          <TimerIcon className='size-5' />
          <Digits>{formatSeconds(restSeconds)}</Digits>
        </Button>
      )}
    </div>
  )

  const forward = next && (
    <Button
      variant={next === 'finish' ? 'success' : next === 'next' && planDone ? 'ink' : 'outline'}
      size='lg'
      className='w-full justify-between'
      onClick={onNext}
      disabled={nextPending}
    >
      {NEXT_LABEL[next]}
      {next === 'skip' ? (
        <SkipForwardIcon className='size-6' />
      ) : (
        <ArrowRightIcon
          className='size-6'
          strokeWidth={2.5}
        />
      )}
    </Button>
  )

  return (
    <StickyFooter className='flex flex-col items-stretch gap-3'>
      {planDone ? forward : start}
      {planDone ? start : forward}
      <Button
        variant='link'
        size='sm'
        className='self-center'
        onClick={onManualSet}
      >
        Записать подход без таймера
      </Button>
    </StickyFooter>
  )
}
