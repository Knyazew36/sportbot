import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import {
  useCurrentWorkout,
  useDiscardWorkout,
  useFinishWorkout,
  useStartWorkout,
  type Workout,
  type WorkoutSet,
} from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { timerEndSignal } from '@/shared/lib/signal'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { ExerciseCard } from './components/ExerciseCard'
import { FocusRest } from './components/FocusRest'
import { FocusSet } from './components/FocusSet'
import { SetEntrySheet } from './components/SetEntrySheet'
import { type NextMode, WorkoutActions } from './components/WorkoutActions'
import { WorkoutLanes } from './components/WorkoutLanes'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms'

const minutesSince = (iso: string | Date) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))

// Экран идущей тренировки (frontend-tz, 8): спокойный экран упражнения, а подход и отдых — на весь экран поверх него
const WorkoutView = ({ workout }: { workout: Workout }) => {
  const navigate = useNavigate()
  const finish = useFinishWorkout()
  const discard = useDiscardWorkout()
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<WorkoutSet | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const timer = useDeadlineTimer({
    storageKey: `rest-timer-${workout.id}`,
    onEnd: () => timerEndSignal(workout.settings),
  })
  const stopwatch = useStopwatch({ storageKey: `set-stopwatch-${workout.id}` })

  const items = workout.exercises
  const fallback = items.find(e => !e.done) ?? items[0]
  const item = items.find(e => e.id === pickedId) ?? fallback
  const doneCount = items.filter(e => e.done).length
  const allDone = items.length > 0 && doneCount === items.length

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
  const { settings } = workout
  const setNumber = item.sets.length + 1

  // Дальше — следующее несделанное по порядку, иначе первое несделанное. Пропуск ничего не отмечает:
  // упражнение без подходов остаётся несделанным и в итогах
  const others = items.filter((e, i) => i !== index && !e.done)
  const nextId = (others.find(e => items.indexOf(e) > index) ?? others[0])?.id
  const nextMode: NextMode | null = others.length
    ? item.sets.length
      ? 'next'
      : 'skip'
    : doneCount
      ? 'finish'
      : null

  const onFinish = () =>
    finish.mutateAsync(workout.id).then(summary => {
      timer.stop()
      stopwatch.stop()
      navigate(buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId: summary.workoutId }), { replace: true })
    })

  const onDiscard = () =>
    discard.mutateAsync(workout.id).then(() => {
      timer.stop()
      stopwatch.stop()
      navigate(ROUTES.TODAY, { replace: true })
    })

  const onNext = () => {
    if (nextMode === 'finish') void onFinish()
    else if (nextId) setPickedId(nextId)
  }

  const startSet = () => {
    timer.stop()
    stopwatch.start()
  }

  const onSaved = () => {
    setEntryOpen(false)
    stopwatch.stop()
    if (settings.showRestTimer && settings.restAutoStart) timer.start(settings.restSeconds)
  }

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
                      variant='success'
                      size='sm'
                    />
                  }
                  title={doneCount ? 'Завершить тренировку?' : 'Засчитывать нечего'}
                  description={
                    doneCount
                      ? `Сделано ${doneCount} из ${pluralize(items.length, EXERCISE_OF_FORMS)}. Тренировка засчитается.`
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
        footer={
          <WorkoutActions
            planDone={item.plannedSets > 0 && item.sets.length >= item.plannedSets}
            next={allDone ? 'finish' : nextMode}
            nextPending={finish.isPending}
            // Отдых сам стартует после подхода — тогда ручная кнопка лишняя
            restSeconds={
              settings.showRestTimer && !settings.restAutoStart && item.sets.length ? settings.restSeconds : null
            }
            onStartSet={startSet}
            onManualSet={() => setEntryOpen(true)}
            onRest={() => timer.start(settings.restSeconds)}
            onNext={onNext}
          />
        }
        className='gap-6 px-gutter'
      >
        <ExerciseCard item={item} />
        <SetList
          item={item}
          onEdit={setEditing}
        />
      </Screen>
      {stopwatch.running ? (
        <FocusSet
          stopwatch={stopwatch}
          title={item.name}
          setNumber={setNumber}
          plannedSets={item.plannedSets}
          onDone={() => setEntryOpen(true)}
        />
      ) : (
        settings.showRestTimer &&
        timer.status !== 'idle' && (
          <FocusRest
            timer={timer}
            title={item.name}
            nextSet={setNumber}
            onToSet={startSet}
            onClose={timer.stop}
          />
        )
      )}
      <SetEntrySheet
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        item={item}
        onSubmitStart={() => setPickedId(item.id)}
        onSaved={onSaved}
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
  const [params, setParams] = useSearchParams()
  const complexId = Number(params.get('complexId')) || undefined
  const current = useCurrentWorkout()
  const hasWorkout = Boolean(current.data?.workout)
  const wantsStart = params.has('complexId') || params.has('start')

  // Начатая тренировка больше не нуждается в параметрах запуска: иначе после «Завершить» или отмены
  // тренировки нет, а complexId в адресе остался — StartWorkout тут же начал бы новую
  useEffect(() => {
    if (hasWorkout && wantsStart) setParams({}, { replace: true })
  }, [hasWorkout, wantsStart, setParams])

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
