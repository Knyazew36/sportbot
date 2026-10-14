import { ArrowRightIcon } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import {
  useCurrentWorkout,
  useDiscardWorkout,
  useFinishWorkout,
  useMarkDone,
  useStartWorkout,
  type Workout,
  type WorkoutSet,
} from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { timerEndSignal } from '@/shared/lib/signal'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { EditSetSheet } from './components/EditSetSheet'
import { ExerciseCard } from './components/ExerciseCard'
import { SetInputPanel } from './components/SetInputPanel'
import { SetList } from './components/SetList'
import { WorkoutLanes } from './components/WorkoutLanes'

const minutesSince = (iso: string | Date) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))

// Экран идущей тренировки (frontend-tz, 8): упражнения, ввод подходов, таймер отдыха, завершение
const WorkoutView = ({ workout }: { workout: Workout }) => {
  const navigate = useNavigate()
  const markDone = useMarkDone()
  const finish = useFinishWorkout()
  const discard = useDiscardWorkout()
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<WorkoutSet | null>(null)
  const timer = useDeadlineTimer({
    storageKey: `rest-timer-${workout.id}`,
    onEnd: () => timerEndSignal(workout.settings.timerSound),
  })

  const items = workout.exercises
  const fallback = items.find(e => !e.done) ?? items[0]
  const item = items.find(e => e.id === pickedId) ?? fallback
  const doneCount = items.filter(e => e.done).length

  if (!item)
    return (
      <Screen
        header={
          <TopBar
            back={ROUTES.TODAY}
            title={workout.complexName}
          />
        }
        className='px-gutter'
      >
        <ScreenState
          state='empty'
          title='В комплексе нет упражнений'
          description='Добавь упражнения в программе или отмени тренировку.'
          action={
            <Button
              variant='outline'
              onClick={() => discard.mutateAsync(workout.id).then(() => navigate(ROUTES.TODAY))}
            >
              Отменить тренировку
            </Button>
          }
        />
      </Screen>
    )

  const index = items.indexOf(item)

  // «Упражнение сделано» — к следующему несделанному по порядку, иначе к первому несделанному
  const onDone = () =>
    markDone.mutateAsync(item.id).then(updated => {
      const rest = updated.exercises.filter(e => !e.done)
      const next = rest.find(e => updated.exercises.indexOf(e) > index) ?? rest[0]
      if (next) setPickedId(next.id)
    })

  const onFinish = () =>
    finish.mutateAsync(workout.id).then(summary => {
      timer.stop()
      navigate(buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId: summary.workoutId }), { replace: true })
    })

  const onDiscard = () =>
    discard.mutateAsync(workout.id).then(() => {
      timer.stop()
      navigate(ROUTES.TODAY, { replace: true })
    })

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={item.id}
        header={
          <>
            <TopBar
              back={ROUTES.TODAY}
              title={workout.complexName}
              subtitle={
                <>
                  упр. {index + 1} из {items.length} ·{' '}
                  <span className='text-primary'>{minutesSince(workout.startedAt)} мин</span>
                </>
              }
              action={
                // Засчитывается, если сделано хотя бы одно упражнение (business-tz, 7.3)
                <ConfirmAction
                  trigger={
                    <Button
                      variant='ink'
                      size='sm'
                    />
                  }
                  title={doneCount ? 'Завершить тренировку?' : 'Засчитывать нечего'}
                  description={
                    doneCount
                      ? `Сделано ${doneCount} из ${items.length} упражнений. Тренировка засчитается.`
                      : 'Пока не сделано ни одного упражнения. Можно отменить тренировку — очередь комплексов не сдвинется.'
                  }
                  confirmLabel={doneCount ? 'Завершить' : 'Отменить тренировку'}
                  confirmVariant={doneCount ? 'default' : 'destructive'}
                  onConfirm={doneCount ? onFinish : onDiscard}
                >
                  Завершить
                </ConfirmAction>
              }
            />
            <WorkoutLanes
              items={items}
              currentId={item.id}
              onPick={setPickedId}
            />
          </>
        }
        className='gap-6 px-gutter'
      >
        <ExerciseCard
          item={item}
          index={index}
        />
        <SetList
          item={item}
          onEdit={setEditing}
        />
        <Rise>
          <Button
            variant='ink'
            size='lg'
            className='w-full justify-between'
            onClick={() => void onDone()}
            disabled={item.done || markDone.isPending}
          >
            Упражнение сделано
            <ArrowRightIcon
              className='size-6'
              strokeWidth={2.5}
            />
          </Button>
        </Rise>
      </Screen>
      <SetInputPanel
        key={`input-${item.id}`}
        item={item}
        settings={workout.settings}
        timer={timer}
        onSubmitStart={() => setPickedId(item.id)}
      />
      <EditSetSheet
        set={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

/** Начать тренировку, если её ещё нет: «Начать» с «Сегодня» ведёт сюда с complexId */
const StartWorkout = ({ complexId }: { complexId?: number }) => {
  const start = useStartWorkout()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    start.mutate(complexId)
  }, [complexId, start])

  if (start.isError)
    return (
      <Screen
        header={
          <TopBar
            back={ROUTES.TODAY}
            title='Тренировка'
          />
        }
        className='px-gutter'
      >
        <ScreenState
          state='error'
          title='Не получилось начать'
          description='Проверь, что в активной программе есть комплекс с упражнениями.'
          action={
            <ButtonLink
              to={ROUTES.TODAY}
              variant='outline'
            >
              На «Сегодня»
            </ButtonLink>
          }
        />
      </Screen>
    )
  return <PageLoader />
}

const WorkoutPage = () => {
  const [params] = useSearchParams()
  const complexId = Number(params.get('complexId')) || undefined
  const current = useCurrentWorkout()

  return (
    <QueryScreen query={current}>
      {({ workout }) => {
        if (workout) return <WorkoutView workout={workout} />
        // Без complexId и без начатой тренировки — например, её завершили в боте
        if (!params.has('complexId') && !params.has('start')) return <Navigate to={ROUTES.TODAY} replace />
        return <StartWorkout complexId={complexId} />
      }}
    </QueryScreen>
  )
}

export default WorkoutPage
