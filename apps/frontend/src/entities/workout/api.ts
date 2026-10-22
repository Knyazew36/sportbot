import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import { statsKeys } from '@/entities/stats'
import type { AddWorkoutItemsDto, ReplaceWorkoutItemDto } from '@/shared/api/generated/model'
import {
  workoutControllerAddItems,
  workoutControllerAnalogs,
  workoutControllerCooldown,
  workoutControllerCooldownFinish,
  workoutControllerCooldownStart,
  workoutControllerCurrent,
  workoutControllerDiscard,
  workoutControllerFind,
  workoutControllerMarkDone,
  workoutControllerRemove,
  workoutControllerRemoveItem,
  workoutControllerReplace,
  workoutControllerShare,
  workoutControllerShared,
  workoutControllerStart,
  workoutControllerSummary,
  workoutControllerWarmupFinish,
} from '@/shared/api/generated/workout/workout'

import {
  type AddSetVars,
  applyWorkout,
  type DeleteSetVars,
  type FinishVars,
  queueKeys,
  type UpdateSetVars,
  WORKOUT_QUEUE_SCOPE,
} from './model/queue'
import { type Workout, workoutKeys, type WorkoutSummary } from './model/types'

export * from './model/types'

/** Незавершённая тренировка: начатая в боте видна и тут (frontend-tz, 4.1) */
export const useCurrentWorkout = () =>
  useQuery({
    queryKey: workoutKeys.current,
    queryFn: () => workoutControllerCurrent(),
    // Подходы могли записать в боте, пока приложение было свёрнуто
    staleTime: 0,
  })

const useApplyWorkout = () => {
  const queryClient = useQueryClient()
  return (workout: Workout) => applyWorkout(queryClient, workout)
}

export const useStartWorkout = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (complexId?: number) => workoutControllerStart(complexId ? { complexId } : {}),
    scope: WORKOUT_QUEUE_SCOPE,
    // Экран тренировки открывается сам — он и есть подтверждение
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

// Подход, правка и удаление — через офлайн-очередь (model/queue.ts): mutationFn, ретраи и тосты там.
// Экран показывает их сразу через useQueuedWorkout, не дожидаясь сервера
export const useAddSet = () => useMutation<Workout, Error, AddSetVars>({ mutationKey: queueKeys.addSet })

export const useUpdateSet = () => useMutation<Workout, Error, UpdateSetVars>({ mutationKey: queueKeys.updateSet })

export const useDeleteSet = () =>
  useMutation<Workout | null, Error, DeleteSetVars>({ mutationKey: queueKeys.deleteSet })

export const useMarkDone = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (itemId: number) => workoutControllerMarkDone(itemId),
    // Экран сам переходит к следующему упражнению
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useAnalogs = (itemId: number) =>
  useQuery({
    queryKey: workoutKeys.analogs(itemId),
    queryFn: () => workoutControllerAnalogs(itemId),
  })

export const useReplaceItem = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: ({ itemId, ...body }: ReplaceWorkoutItemDto & { itemId: number }) =>
      workoutControllerReplace(itemId, body),
    scope: WORKOUT_QUEUE_SCOPE,
    meta: { successMessage: 'Упражнение заменено' },
    onSuccess: apply,
  })
}

export const useAddItems = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: ({ workoutId, ...body }: AddWorkoutItemsDto & { workoutId: number }) =>
      workoutControllerAddItems(workoutId, body),
    scope: WORKOUT_QUEUE_SCOPE,
    meta: { successMessage: 'Упражнение добавлено' },
    onSuccess: apply,
  })
}

/** Убрать упражнение из прошедшей тренировки вместе с подходами — лишнее или добавленное по ошибке */
export const useRemoveItem = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (itemId: number) => workoutControllerRemoveItem(itemId),
    scope: WORKOUT_QUEUE_SCOPE,
    meta: { successMessage: 'Упражнение убрано' },
    onSuccess: apply,
  })
}

/** Завершение тоже в очереди: без сети засчитается, когда она появится, со временем нажатия */
export const useFinishWorkout = () => useMutation<WorkoutSummary, Error, FinishVars>({ mutationKey: queueKeys.finish })

export const useDiscardWorkout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workoutControllerDiscard(id),
    scope: WORKOUT_QUEUE_SCOPE,
    meta: { successMessage: 'Тренировка отменена' },
    onSuccess: () => {
      queryClient.setQueryData(workoutKeys.current, { workout: null })
      // Отменяют и с главной: remove оставил бы открытому экрану старый день «Тренировка идёт».
      // reset открытую главную перезапросит, а закрытую просто сбросит — без мелькания отменённой тренировки
      void queryClient.resetQueries({ queryKey: dayKeys.all })
    },
  })
}

/** Тренировка по id — протокол на экране итога */
export const useWorkout = (id: number) =>
  useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => workoutControllerFind(id),
  })

export const useWorkoutSummary = (id: number) =>
  useQuery({
    queryKey: workoutKeys.summary(id),
    queryFn: () => workoutControllerSummary(id),
  })

/** Заминка: набор собран один раз и не меняется при повторном открытии */
export const useCooldown = (workoutId: number) =>
  useQuery({
    queryKey: workoutKeys.cooldown(workoutId),
    queryFn: () => workoutControllerCooldown(workoutId),
    staleTime: Infinity,
  })

// Конец разминки — со временем нажатия и в общей очереди, как заминка. Экран закрывается сразу,
// не дожидаясь ответа: без сети отметка уйдёт позже
export const useWarmupFinish = () =>
  useMutation({
    mutationFn: (workoutId: number) => workoutControllerWarmupFinish(workoutId, { at: new Date().toISOString() }),
    scope: WORKOUT_QUEUE_SCOPE,
    // Переход к упражнениям и так виден на экране
    meta: { skipSuccessToast: true },
  })

// Время заминки — со временем нажатия и в общей очереди: без сети уйдёт позже, но не исказится.
// Повтор безопасен: сервер пишет только первое начало и первое прохождение
export const useCooldownStart = () =>
  useMutation({
    mutationFn: (workoutId: number) => workoutControllerCooldownStart(workoutId, { at: new Date().toISOString() }),
    scope: WORKOUT_QUEUE_SCOPE,
    // Заминка уже идёт на экране — отметка времени фоновая
    meta: { skipSuccessToast: true },
  })

export const useCooldownFinish = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workoutId: number) => workoutControllerCooldownFinish(workoutId, { at: new Date().toISOString() }),
    scope: WORKOUT_QUEUE_SCOPE,
    // Прохождение заминки и так видно на экране — финальный «Готово»
    meta: { skipSuccessToast: true },
    // Итог показывает время заминки — после неё ведём туда
    onSuccess: (_, workoutId) => queryClient.invalidateQueries({ queryKey: workoutKeys.summary(workoutId) }),
  })
}

/** «Поделиться»: бот присылает в чат карточку результата, её пересылают друзьям */
export const useShareWorkout = () =>
  useMutation({
    mutationFn: (id: number) => workoutControllerShare(id),
    meta: { successMessage: 'Карточка в чате с ботом — перешли её друзьям' },
  })

/** Удалить прошедшую тренировку: день в календаре становится пропуском, серия пересчитывается */
export const useDeleteWorkout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workoutControllerRemove(id),
    meta: { successMessage: 'Тренировка удалена' },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: workoutKeys.detail(id) })
      queryClient.removeQueries({ queryKey: workoutKeys.summary(id) })
      void queryClient.invalidateQueries({ queryKey: statsKeys.all })
      void queryClient.invalidateQueries({ queryKey: dayKeys.all })
    },
  })
}

/** Результат по ссылке из карточки: свой или чужой */
export const useSharedWorkout = (token: string) =>
  useQuery({
    queryKey: workoutKeys.shared(token),
    queryFn: () => workoutControllerShared(token),
  })
