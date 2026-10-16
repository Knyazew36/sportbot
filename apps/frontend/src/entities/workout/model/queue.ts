import { type QueryClient, useMutationState } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import { statsKeys } from '@/entities/stats'
import { getApiErrorStatus, isRetryableError, PERSIST_GC_TIME, useIsOnline } from '@/shared/api'
import type { CreateWorkoutSetDto, UpdateWorkoutSetDto } from '@/shared/api/generated/model'
import {
  workoutControllerAddSet,
  workoutControllerDeleteSet,
  workoutControllerFinish,
  workoutControllerUpdateSet,
} from '@/shared/api/generated/workout/workout'

import { type CurrentWorkout, type Workout, type WorkoutItem, type WorkoutSet, type WorkoutSummary, workoutKeys } from './types'

// Офлайн-очередь тренировки: в зале сеть то есть, то нет. Подходы и завершение не ждут сервер —
// встают в одну очередь (scope), уходят строго по порядку, повторяются, пока сеть не вернётся,
// и переживают закрытие приложения (meta.persist). Дубли при повторе отсекает сервер по clientId

/** Общая очередь: сюда же встают старт, отмена и замена, чтобы не обогнать неотправленные подходы */
export const WORKOUT_QUEUE_SCOPE = { id: 'workout-sync' }

export const queueKeys = {
  all: ['workout', 'sync'] as const,
  addSet: ['workout', 'sync', 'set-add'] as const,
  updateSet: ['workout', 'sync', 'set-update'] as const,
  deleteSet: ['workout', 'sync', 'set-delete'] as const,
  finish: ['workout', 'sync', 'finish'] as const,
}

/** Подход по ссылке: id = 0, пока подход в очереди и сервер его ещё не видел — тогда ищем по clientId */
export type SetRef = Pick<WorkoutSet, 'id' | 'clientId'>
export type AddSetVars = CreateWorkoutSetDto & { clientId: string }
export type UpdateSetVars = SetRef & UpdateWorkoutSetDto
export type DeleteSetVars = SetRef
export type FinishVars = { id: number; finishedAt: string }

type QueueEntry =
  | { kind: 'set-add'; variables: AddSetVars }
  | { kind: 'set-update'; variables: UpdateSetVars }
  | { kind: 'set-delete'; variables: DeleteSetVars }
  | { kind: 'finish'; variables: FinishVars }

export const newClientId = (): string =>
  // randomUUID есть не во всех webview мессенджеров — запасной uuid v4 из getRandomValues
  crypto.randomUUID?.() ??
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0]! & (15 >> (Number(c) / 4)))).toString(16),
  )

/** Любой ответ с тренировкой обновляет экран сразу, без повторного запроса */
export const applyWorkout = (queryClient: QueryClient, workout: Workout) => {
  if (workout.status === 'IN_PROGRESS') {
    queryClient.setQueryData<CurrentWorkout>(workoutKeys.current, { workout })
  } else {
    // Правка прошедшей тренировки из статистики: идущая не тронута, зато меняются графики, мышцы и итог
    queryClient.setQueryData(workoutKeys.detail(workout.id), workout)
    void queryClient.invalidateQueries({ queryKey: workoutKeys.summary(workout.id) })
    void queryClient.invalidateQueries({ queryKey: statsKeys.all })
  }
  void queryClient.invalidateQueries({ queryKey: dayKeys.all })
}

const findSet = (workout: Workout | null | undefined, clientId: string) =>
  workout?.exercises.flatMap(e => e.sets).find(s => s.clientId === clientId)

/**
 * Серверный id подхода в момент отправки. Подход, записанный без сети, получил id только что —
 * очередь гарантирует, что его создание уже прошло и ответ лежит в кеше
 */
const resolveSetId = (queryClient: QueryClient, ref: SetRef): number => {
  if (ref.id > 0 || !ref.clientId) return ref.id
  const current = queryClient.getQueryData<CurrentWorkout>(workoutKeys.current)?.workout
  const found =
    findSet(current, ref.clientId) ??
    queryClient
      .getQueriesData<Workout>({ queryKey: ['workout', 'detail'] })
      .map(([, workout]) => findSet(workout, ref.clientId!))
      .find(Boolean)
  // Создание не прошло (сервер отказал) — править нечего. Обычная ошибка: повторять её бессмысленно
  if (!found) throw new Error('Подход не сохранился — запиши его заново')
  return found.id
}

const queueDefaults = {
  scope: WORKOUT_QUEUE_SCOPE,
  // Без сети react-query сам ставит очередь на паузу; сбои в плохой сети повторяем без лимита
  retry: (_failureCount: number, error: Error) => isRetryableError(error),
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
}

/** Регистрируется до восстановления кеша: у восстановленной из хранилища мутации есть только ключ */
export const registerWorkoutQueue = (queryClient: QueryClient) => {
  queryClient.setQueryDefaults(workoutKeys.current, { gcTime: PERSIST_GC_TIME, meta: { persist: true } })

  queryClient.setMutationDefaults(queueKeys.addSet, {
    ...queueDefaults,
    mutationFn: (body: AddSetVars) => workoutControllerAddSet(body),
    onSuccess: (workout: Workout) => applyWorkout(queryClient, workout),
    // Подход сразу появляется в списке и запускается таймер отдыха — тост лишний.
    // Без inlineFieldErrors: шторка ввода к ответу уже закрыта, ошибку некуда показать, кроме тоста
    meta: { persist: true, skipSuccessToast: true },
  })

  queryClient.setMutationDefaults(queueKeys.updateSet, {
    ...queueDefaults,
    mutationFn: ({ id, clientId, ...body }: UpdateSetVars) =>
      workoutControllerUpdateSet(resolveSetId(queryClient, { id, clientId }), body),
    onSuccess: (workout: Workout) => applyWorkout(queryClient, workout),
    // Исправленные цифры видны в списке сразу, ещё до ответа сервера
    meta: { persist: true, skipSuccessToast: true },
  })

  queryClient.setMutationDefaults(queueKeys.deleteSet, {
    ...queueDefaults,
    mutationFn: async (ref: DeleteSetVars) => {
      try {
        return await workoutControllerDeleteSet(resolveSetId(queryClient, ref))
      } catch (error) {
        // Повтор после потерянного ответа: подход уже удалён — это и был нужный результат
        if (getApiErrorStatus(error) === 404) return null
        throw error
      }
    },
    onSuccess: (workout: Workout | null) => {
      if (workout) applyWorkout(queryClient, workout)
      else void queryClient.invalidateQueries({ queryKey: workoutKeys.current })
    },
    // Подход пропадает из списка сразу, ещё до ответа сервера
    meta: { persist: true, skipSuccessToast: true },
  })

  queryClient.setMutationDefaults(queueKeys.finish, {
    ...queueDefaults,
    mutationFn: ({ id, finishedAt }: FinishVars) => workoutControllerFinish(id, { finishedAt }),
    onSuccess: (summary: WorkoutSummary) => {
      queryClient.setQueryData(workoutKeys.summary(summary.workoutId), summary)
      queryClient.setQueryData<CurrentWorkout>(workoutKeys.current, { workout: null })
      // Главная сейчас не открыта: invalidate лишь пометил бы кэш, и по «Домой» сначала мелькнул бы
      // старый день с «Продолжить». Сброс — главная покажет загрузку и сразу засчитанный день
      queryClient.removeQueries({ queryKey: dayKeys.all })
      // Засчитанная тренировка меняет серию, посещаемость и веса
      void queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
    // Засчитанность видна на весь экран: следом предложение заминки, а после офлайн-завершения —
    // засчитанный день на «Сегодня»
    meta: { persist: true, skipSuccessToast: true },
  })
}

/** Неотправленные действия по порядку записи */
export const useWorkoutQueue = (): QueueEntry[] =>
  useMutationState({
    filters: { mutationKey: queueKeys.all, status: 'pending' },
    select: mutation => ({ kind: mutation.options.mutationKey?.[2], variables: mutation.state.variables }) as QueueEntry,
  })

const sameSet = (set: WorkoutSet, ref: SetRef) => (ref.clientId ? set.clientId === ref.clientId : set.id === ref.id)

const mapSets = (items: WorkoutItem[], ref: SetRef, fn: (sets: WorkoutSet[], index: number) => WorkoutSet[]) =>
  items.map(item => {
    const index = item.sets.findIndex(s => sameSet(s, ref))
    return index === -1 ? item : { ...item, sets: fn(item.sets, index) }
  })

const applyEntry = (items: WorkoutItem[], entry: QueueEntry): WorkoutItem[] => {
  switch (entry.kind) {
    case 'set-add': {
      const { itemId, clientId, weight, reps } = entry.variables
      return items.map(item => {
        // Сервер уже принял подход, ответ пришёл раньше, чем мутация закрылась
        if (item.id !== itemId || item.sets.some(s => s.clientId === clientId)) return item
        const number = (item.sets.at(-1)?.number ?? 0) + 1
        const set: WorkoutSet = { id: 0, clientId, number, weight: weight ?? 0, reps, pending: true }
        return { ...item, done: true, sets: [...item.sets, set] }
      })
    }
    case 'set-update': {
      const { id, clientId, weight, reps } = entry.variables
      return mapSets(items, { id, clientId }, (sets, i) =>
        sets.map((s, j) => (j === i ? { ...s, weight: weight ?? 0, reps, pending: true } : s)),
      )
    }
    case 'set-delete':
      // Номера следующих подходов сдвигаются, как это сделает сервер
      return mapSets(items, entry.variables, (sets, i) =>
        sets.filter((_, j) => j !== i).map((s, j) => (j >= i ? { ...s, number: s.number - 1 } : s)),
      )
    default:
      return items
  }
}

/**
 * Тренировка такой, какой её видит человек: ответ сервера плюс неотправленные действия.
 * Наложение, а не запись в кеш: переживает перезагрузку, и ответ сервера не затирает ещё не отправленное
 */
export const useQueuedWorkout = <T extends Workout | null | undefined>(workout: T) => {
  const queue = useWorkoutQueue()
  if (!workout) return { workout, finishing: false }
  const own = queue.filter(entry => entry.kind !== 'finish' || entry.variables.id === workout.id)
  return {
    workout: { ...workout, exercises: own.reduce(applyEntry, workout.exercises) } as NonNullable<T>,
    finishing: own.some(entry => entry.kind === 'finish'),
  }
}

/** Завершение тренировки ждёт сети: на «Сегодня» вместо «Продолжить» — плашка */
export const useFinishQueued = (workoutId: number | undefined): boolean =>
  useWorkoutQueue().some(entry => entry.kind === 'finish' && entry.variables.id === workoutId)

/** Шапка тренировки: есть ли сеть, сколько действий ещё не отправлено и не застряла ли отправка */
export const useWorkoutSync = () => {
  const online = useIsOnline()
  const failures = useMutationState({
    filters: { mutationKey: queueKeys.all, status: 'pending' },
    select: mutation => mutation.state.failureCount,
  })
  return { online, pending: failures.length, retrying: failures.some(count => count > 0) }
}
