import { useNavigate } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import {
  currentItem,
  type SetTiming,
  supersetDoneWith,
  supersetLabels,
  supersetRound,
  useDiscardWorkout,
  useFinishWorkout,
  useQueuedWorkout,
  useWarmupFinish,
  type Workout,
  type WorkoutItem,
} from '@sportbot/api/entities/workout'
import { useIsOnline } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { readTimer, useDeadlineTimer, writeTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { timerEndSignal } from '@/shared/lib/signal'
import { local } from '@/shared/lib/storage'
import { haptic } from '@/shared/miniapp'

import type { EditingSet } from '@/widgets/workout/EditSetSheet'

import type { NextMode } from '../components/WorkoutActions'

/** Флаг в localStorage: переживает уход с экрана и перезагрузку */
const useStoredFlag = (key: string) => {
  const [value, setValue] = useState(() => local.get(key) !== null)
  const set = (next: boolean) => {
    setValue(next)
    if (next) local.set(key, '1')
    else local.remove(key)
  }
  return [value, set] as const
}

/**
 * Логика экрана идущей тренировки (frontend-tz, 8): какое упражнение на экране, разминка, подход, круг суперсета,
 * отдых и завершение. Без разметки — экран только показывает состояние и вызывает действия.
 * active = null — в тренировке нет упражнений
 */
export const useWorkoutFlow = (saved: Workout) => {
  const navigate = useNavigate()
  // Сервер плюс неотправленные подходы: в зале без сети экран живёт очередью
  const { workout, finishing } = useQueuedWorkout(saved)
  const online = useIsOnline()
  const finish = useFinishWorkout()
  const discard = useDiscardWorkout()
  const { settings } = workout

  // Выбранное упражнение переживает уход с экрана: иначе после возврата экран сам перескакивал
  // на первое несделанное, хотя человек ещё отдыхает после последнего подхода текущего
  const pickedKey = `workout-picked-${saved.id}`
  const [pickedId, setPickedIdState] = useState<number | null>(() => Number(local.get(pickedKey)) || null)
  const setPickedId = (id: number) => {
    setPickedIdState(id)
    local.set(pickedKey, String(id))
  }
  // Дорожка открывает просмотр, а не переход: случайный тап мимо текущей перескакивал упражнение
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [editing, setEditing] = useState<EditingSet | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  // «К упражнению» сворачивает отдых, а не останавливает: пока идёт, в футере кнопка отдыха вместо подхода
  const [restHidden, setRestHidden] = useState(false)
  // Автостарт: отдых кончился — подход начинается сам. Действие собирается ниже, после выбора упражнения,
  // а onEnd таймер берёт из последнего рендера — поэтому let, а не хук после раннего выхода
  let autoStartSet: (() => void) | null = null
  const timer = useDeadlineTimer({
    storageKey: `rest-timer-${workout.id}`,
    onEnd: () => {
      timerEndSignal(settings)
      autoStartSet?.()
    },
  })
  const stopwatch = useStopwatch({ storageKey: `set-stopwatch-${workout.id}` })
  // Отдых перед идущим подходом: таймер на старте подхода останавливается, а его план нужен при записи,
  // а сам отдых — при отмене подхода
  const restBeforeSetKey = `set-rest-before-${workout.id}`
  // Идёт круг суперсета: переживает перезагрузку вместе с секундомером круга
  const [roundActive, setRoundActive] = useStoredFlag(`round-active-${workout.id}`)
  // Подход одному участнику суперсета: забытый подход или круг из одного упражнения
  const [entryFor, setEntryFor] = useState<number | null>(null)
  const [roundOpen, setRoundOpen] = useState(false)
  // Разминка кончилась с первым подходом: отметка может стоять в офлайн-очереди, а экран должен уйти сразу
  const warmupKey = `warmup-done-${workout.id}`
  const [warmupEnded, setWarmupEnded] = useState(() => local.get(warmupKey) !== null)
  // Свёрнута к экрану упражнения: отсчёт идёт, вернуться — кнопкой в футере. Переживает уход с экрана
  const warmupHiddenKey = `warmup-hidden-${workout.id}`
  const [warmupHidden, setWarmupHidden] = useStoredFlag(warmupHiddenKey)
  const warmupFinish = useWarmupFinish()
  const warmupTimer = useDeadlineTimer({
    storageKey: `warmup-timer-${workout.id}`,
    onEnd: () => timerEndSignal(settings),
  })
  // Разминка только до первого подхода: записал подход — разминка позади
  const warmupMinutes =
    workout.warmupMinutes && !workout.warmupFinishedAt && !warmupEnded && !workout.exercises.some(e => e.sets.length)
      ? workout.warmupMinutes
      : null
  const { status: warmupStatus, start: startWarmup } = warmupTimer
  // Отсчёт от начала тренировки: экран открыли позже — осталось меньше
  useEffect(() => {
    if (!warmupMinutes || warmupStatus !== 'idle') return
    const passed = Math.floor((Date.now() - Date.parse(workout.startedAt)) / 1000)
    startWarmup(Math.max(1, warmupMinutes * 60 - passed))
  }, [warmupMinutes, warmupStatus, startWarmup, workout.startedAt])

  // Штамп поверх экрана («Круг 2 ✓») и вспышка цепочки круга
  const [stamp, setStamp] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const stampTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(stampTimer.current), [])
  const flashStamp = (text: string) => {
    window.clearTimeout(stampTimer.current)
    setStamp(text)
    stampTimer.current = window.setTimeout(() => setStamp(null), 900)
  }

  const items = workout.exercises
  const item = items.find(e => e.id === pickedId) ?? currentItem(items)
  const doneCount = items.filter(e => e.done).length
  const allDone = items.length > 0 && doneCount === items.length

  const clearLocal = () => {
    timer.stop()
    stopwatch.stop()
    local.remove(restBeforeSetKey)
    local.remove(warmupKey)
    local.remove(warmupHiddenKey)
    local.remove(pickedKey)
  }

  // Завершение встаёт в очередь со временем нажатия: без сети засчитается позже, а длительность не исказится.
  // К заминке уводит WorkoutPage, когда сервер засчитал: этот экран к тому моменту уже размонтирован
  const onFinish = () => {
    clearLocal()
    finish.mutate({ id: workout.id, finishedAt: new Date().toISOString() })
  }

  const onDiscard = () =>
    discard.mutateAsync(workout.id).then(() => {
      clearLocal()
      navigate(ROUTES.TODAY, { replace: true })
    })

  const base = {
    workout,
    finishing,
    online,
    items,
    doneCount,
    finishPending: finish.isPending,
    onFinish,
    onDiscard,
    stamp,
    editing,
    setEditing,
  }

  if (!item) return { ...base, active: null }

  const preview = items.find(e => e.id === previewId) ?? null
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
  const restRunning = settings.showRestTimer && timer.status !== 'idle'
  const restOpen = restRunning && !restHidden

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

  // Конец разминки — начало первого подхода любым путём: секундомер, круг или ручной ввод
  const endWarmup = () => {
    if (!warmupMinutes) return
    local.set(warmupKey, '1')
    local.remove(warmupHiddenKey)
    setWarmupEnded(true)
    warmupTimer.stop()
    warmupFinish.mutate(workout.id)
  }

  const onNext = () => {
    if (forward === 'finish') void onFinish()
    else if (nextId) setPickedId(nextId)
  }

  const startRest = (seconds: number) => {
    setRestHidden(false)
    timer.start(seconds)
  }

  // С первого подхода человек либо в подходе, либо отдыхает: отдых начинается в момент «Готово»,
  // и ввод веса с повторами уже идёт в его счёт
  const restAfterSet = () => {
    if (settings.showRestTimer) startRest(settings.restSeconds)
  }

  // Ручной ввод без секундомера: подход только что кончился — пошёл отдых. Идущий отдых не сбрасываем:
  // так дописывают забытый подход, а человек всё ещё отдыхает
  const restAfterManual = (timed: boolean) => {
    if (!timed && timer.status === 'idle') restAfterSet()
  }

  // Подход кончился, но ввод закрыли без записи — подход продолжается: отдых, начатый на «Готово», отменяем
  const backToSet = () => {
    if (!stopwatch.paused) return
    timer.stop()
    stopwatch.resume()
  }

  // Суперсет закрыт: штамп и сразу следующий блок, отдых перед ним идёт с «Готово» — сократить его решает человек
  const finishSuperset = (letter: string) => {
    haptic.success()
    flashStamp(`Суперсет ${letter} готов`)
    if (nextId) setPickedId(nextId)
  }

  // Круг из нескольких упражнений идёт фокусом круга; из одного — обычным подходом
  const startSet = () => {
    endWarmup()
    // План — с учётом всех «+30 с»; таймер не запускали — плана нет
    writeTimer(restBeforeSetKey, timer.snapshot)
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
  const finishRound = () => {
    if (!superset) return
    haptic.success()
    stopwatch.pause()
    restAfterSet()
    setBurstKey(k => k + 1)
    flashStamp(`Круг ${superset.number} ✓`)
    window.setTimeout(() => setRoundOpen(true), 550)
  }

  // Подход закончен — его время стоит, а ввод веса и повторов уже отдых
  const finishSet = () => {
    stopwatch.pause()
    restAfterSet()
    setEntryOpen(true)
  }

  // Время подхода берётся в момент записи: с секундомером — нажатие «Готово» и чистое время,
  // без него (ручной ввод) — сам момент записи. Подход доедет через очередь позже, время останется этим
  const setTiming = (): SetTiming => {
    if (!stopwatch.running) return { doneAt: new Date().toISOString() }
    const restBefore = readTimer(restBeforeSetKey)
    return {
      doneAt: new Date(stopwatch.pausedAt ?? Date.now()).toISOString(),
      workSeconds: stopwatch.elapsed,
      restTargetSeconds: restBefore.status === 'idle' ? undefined : restBefore.total,
    }
  }

  // План выполнен — лишний подход сам не начинаем, на экране отдыха и так «Следующее упражнение».
  // Отдых кончился давно (приложение открыли позже) — подход тоже не стартуем: человек мог уже уйти
  if (settings.restAutoStart)
    autoStartSet = () => {
      if (planDone || stopwatch.running || entryOpen || roundOpen || timer.left < -5) return
      startSet()
    }

  // Подход запущен по ошибке: всё как до старта, отдых идёт дальше с тем же концом — его время не останавливалось
  const cancelSet = () => {
    stopwatch.stop()
    setRoundActive(false)
    setEntryFor(null)
    timer.restore(readTimer(restBeforeSetKey))
    local.remove(restBeforeSetKey)
  }

  const onRoundSaved = (addedIds: number[]) => {
    setRoundOpen(false)
    const timed = stopwatch.running
    stopwatch.stop()
    local.remove(restBeforeSetKey)
    setRoundActive(false)
    restAfterManual(timed)
    if (superset && supersetDoneWith(superset.members, addedIds)) finishSuperset(superset.letter)
  }

  const onSaved = () => {
    setEntryOpen(false)
    const timed = stopwatch.running
    stopwatch.stop()
    local.remove(restBeforeSetKey)
    setEntryFor(null)
    restAfterManual(timed)
    if (superset && supersetDoneWith(superset.members, [entryItem.id])) finishSuperset(superset.letter)
  }

  return {
    ...base,
    active: {
      item,
      block,
      superset,
      entryItem,
      setNumber,
      focusTitle,
      preview,
      forward,
      planDone,
      timer,
      stopwatch,
      warmupTimer,
      warmupMinutes,
      warmupHidden,
      restHidden,
      restRunning,
      restOpen,
      inRound,
      burstKey,
      entryOpen,
      roundOpen,
      setTiming,
      startSet,
      finishSet,
      finishRound,
      cancelSet,
      onNext,
      onSaved,
      onRoundSaved,
      // Дорожка: своё упражнение уже на экране, чужое — открываем просмотр
      pickLane: (id: number) => {
        if (!block.some(e => e.id === id)) setPreviewId(id)
      },
      closePreview: () => setPreviewId(null),
      goToPreview: () => {
        if (!preview) return
        setPickedId(preview.id)
        setPreviewId(null)
      },
      addSet: () => {
        endWarmup()
        setEntryOpen(true)
      },
      addSetFor: (member: WorkoutItem) => {
        endWarmup()
        setEntryFor(member.id)
        setEntryOpen(true)
      },
      recordRound: () => {
        endWarmup()
        setRoundOpen(true)
      },
      // Закрыл ввод без записи — подход продолжается с того же времени; ручной ввод без секундомера это не трогает
      closeEntry: () => {
        setEntryOpen(false)
        backToSet()
      },
      // Закрыл без записи — круг продолжается с последнего упражнения с того же времени
      closeRound: () => {
        setRoundOpen(false)
        backToSet()
      },
      pickEntryItem: () => setPickedId(entryItem.id),
      restNow: () => startRest(settings.restSeconds),
      openRest: () => setRestHidden(false),
      hideRest: () => setRestHidden(true),
      // Отдых перед следующим упражнением продолжается: сворачиваем его, а не сбрасываем.
      // Завершение тренировки останавливает таймер само
      nextFromRest: () => {
        setRestHidden(true)
        onNext()
      },
      openWarmup: () => setWarmupHidden(false),
      hideWarmup: () => setWarmupHidden(true),
      // Живая плашка возвращает в отдых или разминку
      returnToFocus: () => {
        if (restRunning) setRestHidden(false)
        else if (warmupMinutes) setWarmupHidden(false)
      },
      targetReached: () => timerEndSignal(settings),
    },
  }
}

export type WorkoutFlow = ReturnType<typeof useWorkoutFlow>
export type ActiveWorkout = NonNullable<WorkoutFlow['active']>
