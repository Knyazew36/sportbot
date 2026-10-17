import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import {
  currentItem,
  supersetDoneWith,
  supersetLabels,
  supersetRound,
  useCurrentWorkout,
  useDiscardWorkout,
  useFinishWorkout,
  useQueuedWorkout,
  type SetTiming,
  useStartWorkout,
  type Workout,
  type WorkoutSet,
} from '@/entities/workout'
import { useIsOnline } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed'
import { timerEndSignal } from '@/shared/lib/signal'
import { local } from '@/shared/lib/storage'
import { haptic } from '@/shared/miniapp'
import { LiveDot } from '@/shared/ui/kit/LiveDot'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageLoader } from '@/shared/ui/kit/PageLoader'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Stamp } from '@/shared/ui/kit/Stamp'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { ExerciseCard } from './components/ExerciseCard'
import { FocusRest } from './components/FocusRest'
import { FinishPending } from './components/FinishPending'
import { FocusRound } from './components/FocusRound'
import { FocusSet } from './components/FocusSet'
import { RoundEntrySheet } from './components/RoundEntrySheet'
import { SetEntrySheet } from './components/SetEntrySheet'
import { SupersetScreen } from './components/SupersetScreen'
import { SyncStatus } from './components/SyncStatus'
import { type NextMode, WorkoutActions } from './components/WorkoutActions'
import { WorkoutLanes } from './components/WorkoutLanes'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms'

// Время в подписи шапки: без разрядки капса и с равной шириной цифр, иначе строка подрагивает каждую секунду.
// Отдельный компонент, чтобы ежесекундный тик перерисовывал только его, а не весь экран
const ElapsedInline = ({ startedAt }: { startedAt: string }) => (
  <span className='text-foreground inline-flex items-center gap-1.5 align-middle tracking-normal tabular-nums'>
    <LiveDot />
    {useWorkoutElapsed(startedAt)}
  </span>
)

// Экран идущей тренировки (frontend-tz, 8): спокойный экран упражнения, а подход и отдых — на весь экран поверх него
const WorkoutView = ({ workout: saved }: { workout: Workout }) => {
  const navigate = useNavigate()
  // Сервер плюс неотправленные подходы: в зале без сети экран живёт очередью
  const { workout, finishing } = useQueuedWorkout(saved)
  const online = useIsOnline()
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
  // План отдыха перед идущим подходом: таймер на старте подхода останавливается, а план нужен при записи
  const restTargetKey = `set-rest-target-${workout.id}`
  // Идёт круг суперсета: переживает перезагрузку вместе с секундомером круга
  const roundKey = `round-active-${workout.id}`
  const [roundActive, setRoundActiveState] = useState(() => local.get(roundKey) !== null)
  const setRoundActive = (next: boolean) => {
    setRoundActiveState(next)
    if (next) local.set(roundKey, '1')
    else local.remove(roundKey)
  }
  // Подход одному участнику суперсета: забытый подход или круг из одного упражнения
  const [entryFor, setEntryFor] = useState<number | null>(null)
  const [roundOpen, setRoundOpen] = useState(false)
  const [stamp, setStamp] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const stampTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(stampTimer.current), [])
  const flashStamp = (text: string) => {
    window.clearTimeout(stampTimer.current)
    setStamp(text)
    stampTimer.current = window.setTimeout(() => setStamp(null), 900)
  }

  // Завершение в очереди: тренировки для человека уже нет, ждём сервер или уходим на «Сегодня»
  if (finishing) return <FinishPending />

  const items = workout.exercises
  const item = items.find(e => e.id === pickedId) ?? currentItem(items)
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
              // Отмена удаляет тренировку на сервере — без сети её не сделать
              disabled={!online}
              onClick={() => discard.mutateAsync(workout.id).then(() => navigate(ROUTES.TODAY))}
            >
              {online ? 'Отменить тренировку' : 'Отменить · нужна сеть'}
            </Button>
          }
        />
      </Screen>
    )

  const index = items.indexOf(item)
  const { settings } = workout
  // Суперсет — один экран и один круг на всех участников; одиночное упражнение — как раньше
  const superset = supersetRound(items, item)
  const block = superset?.members ?? [item]
  const labels = superset ? supersetLabels(superset.members) : []
  const labelOf = (id: number) => labels[block.findIndex(e => e.id === id)]
  const entryItem = block.find(e => e.id === entryFor) ?? item
  const setNumber = entryItem.sets.length + 1
  // Подход в суперсете подписан «A1 ·»: видно, что это часть круга, а не одно упражнение
  const focusTitle = superset ? `${labelOf(entryItem.id)} · ${entryItem.name}` : entryItem.name
  const inRound = superset !== null && roundActive && superset.round.length > 1 && stopwatch.running

  // Дальше — следующий несделанный блок по порядку, иначе первый несделанный. Пропуск ничего не отмечает:
  // упражнение без подходов остаётся несделанным и в итогах
  const lastIndex = items.indexOf(block.at(-1)!)
  const others = items.filter(e => !block.includes(e) && !e.done)
  const nextId = (others.find(e => items.indexOf(e) > lastIndex) ?? others[0])?.id
  const nextMode: NextMode | null = others.length
    ? block.some(e => e.sets.length)
      ? 'next'
      : 'skip'
    : doneCount
      ? 'finish'
      : null

  const forward = allDone ? 'finish' : nextMode
  const planDone = superset ? superset.done : item.plannedSets > 0 && item.sets.length >= item.plannedSets

  // Завершение встаёт в очередь со временем нажатия: без сети засчитается позже, а длительность не исказится.
  // Колбэк mutate срабатывает, только пока экран открыт: после ухода на «Сегодня» итог туда уже не уведёт
  const onFinish = () => {
    timer.stop()
    stopwatch.stop()
    local.remove(restTargetKey)
    finish.mutate(
      { id: workout.id, finishedAt: new Date().toISOString() },
      {
        onSuccess: summary =>
          navigate(buildPath(ROUTES.WORKOUT_FINISHED, { workoutId: summary.workoutId }), { replace: true }),
      },
    )
  }

  const onDiscard = () =>
    discard.mutateAsync(workout.id).then(() => {
      timer.stop()
      stopwatch.stop()
      local.remove(restTargetKey)
      navigate(ROUTES.TODAY, { replace: true })
    })

  const onNext = () => {
    if (forward === 'finish') void onFinish()
    else if (nextId) setPickedId(nextId)
  }

  const rest = () => {
    if (settings.showRestTimer && settings.restAutoStart) timer.start(settings.restSeconds)
  }

  // Суперсет закрыт: штамп и сразу следующий блок — отдыхать перед ним или нет, решает человек
  const finishSuperset = (letter: string) => {
    haptic.success()
    flashStamp(`Суперсет ${letter} готов`)
    if (nextId) setPickedId(nextId)
  }

  // Круг из нескольких упражнений идёт фокусом круга; из одного — обычным подходом
  const startSet = () => {
    // План — с учётом всех «+30 с»; таймер не запускали — плана нет
    if (timer.status !== 'idle') local.set(restTargetKey, String(timer.total))
    else local.remove(restTargetKey)
    timer.stop()
    if (superset) {
      const [first, second] = superset.round
      if (!first) return
      if (second) setRoundActive(true)
      else setEntryFor(first.id)
    }
    stopwatch.start()
  }

  // Конец круга: вспышка цепочки и штамп, потом шторка ввода — пока шторка едет, штамп успевает прочитаться
  const finishRound = (number: number) => {
    haptic.success()
    stopwatch.pause()
    setBurstKey(k => k + 1)
    flashStamp(`Круг ${number} ✓`)
    window.setTimeout(() => setRoundOpen(true), 550)
  }

  // Время подхода берётся в момент записи: с секундомером — нажатие «Готово» и чистое время,
  // без него (ручной ввод) — сам момент записи. Подход доедет через очередь позже, время останется этим
  const setTiming = (): SetTiming => {
    if (!stopwatch.running) return { doneAt: new Date().toISOString() }
    const restTarget = Number(local.get(restTargetKey))
    return {
      doneAt: new Date(stopwatch.pausedAt ?? Date.now()).toISOString(),
      workSeconds: stopwatch.elapsed,
      restTargetSeconds: restTarget > 0 ? restTarget : undefined,
    }
  }

  const cancelRound = () => {
    stopwatch.stop()
    setRoundActive(false)
  }

  const onRoundSaved = (addedIds: number[]) => {
    setRoundOpen(false)
    stopwatch.stop()
    local.remove(restTargetKey)
    setRoundActive(false)
    if (superset && supersetDoneWith(superset.members, addedIds)) finishSuperset(superset.letter)
    else rest()
  }

  const onSaved = () => {
    setEntryOpen(false)
    stopwatch.stop()
    local.remove(restTargetKey)
    setEntryFor(null)
    if (superset && supersetDoneWith(superset.members, [entryItem.id])) finishSuperset(superset.letter)
    else rest()
  }

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        // Внутри суперсета экран не пересоздаётся: лента карточек и её прокрутка живут, пока идёт суперсет
        key={superset ? `s${superset.superset}` : item.id}
        header={
          <>
            <TopBar
              back={ROUTES.TODAY}
              title={workout.complexName}
              subtitle={
                <>
                  упр. {index + 1} из {items.length} · <ElapsedInline startedAt={workout.startedAt} />
                </>
              }
              action={
                // Засчитывается, если сделано хотя бы одно упражнение (business-tz, 7.3)
                <ConfirmAction
                  trigger={
                    <Button
                      variant='success'
                      size='sm'
                      // Засчитывать нечего — остаётся только отмена, а она без сети невозможна
                      disabled={!doneCount && !online}
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
            <SyncStatus />
            <WorkoutLanes
              items={items}
              currentId={item.id}
              onPick={setPickedId}
            />
          </>
        }
        footer={
          <WorkoutActions
            planDone={planDone}
            next={forward}
            nextPending={finish.isPending}
            // Отдых сам стартует после подхода — тогда ручная кнопка лишняя
            restSeconds={
              settings.showRestTimer && !settings.restAutoStart && block.some(e => e.sets.length)
                ? settings.restSeconds
                : null
            }
            round={superset ? (superset.done ? null : superset.number) : undefined}
            onRecordRound={() => setRoundOpen(true)}
            onStartSet={startSet}
            onRest={() => timer.start(settings.restSeconds)}
            onNext={onNext}
          />
        }
        className='gap-6 px-gutter'
      >
        {superset ? (
          <SupersetScreen
            round={superset}
            onEdit={setEditing}
            onAddSet={member => {
              setEntryFor(member.id)
              setEntryOpen(true)
            }}
          />
        ) : (
          <>
            <ExerciseCard item={item} />
            <SetList
              item={item}
              onEdit={setEditing}
              onAdd={() => setEntryOpen(true)}
            />
          </>
        )}
      </Screen>
      {inRound ? (
        <FocusRound
          stopwatch={stopwatch}
          round={superset}
          startedAt={workout.startedAt}
          burstKey={burstKey || undefined}
          onFinish={() => finishRound(superset.number)}
          onRestart={stopwatch.start}
          onCancel={cancelRound}
        />
      ) : stopwatch.running ? (
        <FocusSet
          stopwatch={stopwatch}
          title={focusTitle}
          startedAt={workout.startedAt}
          setNumber={setNumber}
          plannedSets={entryItem.plannedSets}
          // Подход закончен — время стоит, пока вводятся вес и повторы
          onDone={() => {
            stopwatch.pause()
            setEntryOpen(true)
          }}
        />
      ) : (
        settings.showRestTimer &&
        timer.status !== 'idle' && (
          <FocusRest
            timer={timer}
            title={superset ? `Суперсет ${superset.letter}` : focusTitle}
            startedAt={workout.startedAt}
            nextSet={setNumber}
            plannedSets={item.plannedSets}
            round={
              superset && !superset.done
                ? {
                    letter: superset.letter,
                    number: superset.number,
                    rounds: superset.rounds,
                  }
                : null
            }
            onToSet={startSet}
            onClose={timer.stop}
            planDone={planDone}
            next={forward}
            onNext={() => {
              timer.stop()
              onNext()
            }}
          />
        )
      )}
      <SetEntrySheet
        open={entryOpen}
        // Закрыл без записи — подход продолжается с того же времени; ручной ввод без секундомера это не трогает
        onClose={() => {
          setEntryOpen(false)
          stopwatch.resume()
        }}
        item={entryItem}
        timing={setTiming}
        onSubmitStart={() => setPickedId(entryItem.id)}
        onSaved={onSaved}
      />
      <RoundEntrySheet
        open={roundOpen}
        round={superset}
        timing={setTiming}
        // Закрыл без записи — круг продолжается с последнего упражнения с того же времени
        onClose={() => {
          setRoundOpen(false)
          stopwatch.resume()
        }}
        onSaved={onRoundSaved}
      />
      <Stamp text={stamp} />
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

  // Старт создаёт тренировку на сервере: без сети мутация стоит на паузе и сама уйдёт, когда сеть появится
  if (start.isPaused)
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
          title='Нет сети'
          description='Начнём тренировку, как только появится связь. Экран можно не закрывать.'
        />
      </Screen>
    )

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
