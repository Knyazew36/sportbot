import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import { statsKeys } from '@/entities/stats'
import type {
  CooldownResponseDto,
  CreateWorkoutSetDto,
  ReplaceWorkoutItemDto,
  UpdateWorkoutSetDto,
  WorkoutAnalogResponseDto,
  WorkoutResponseDto,
  WorkoutSummaryResponseDto,
} from '@/shared/api/generated/model'
import {
  workoutControllerAddSet,
  workoutControllerAnalogs,
  workoutControllerCooldown,
  workoutControllerCurrent,
  workoutControllerDeleteSet,
  workoutControllerDiscard,
  workoutControllerFind,
  workoutControllerFinish,
  workoutControllerMarkDone,
  workoutControllerReplace,
  workoutControllerStart,
  workoutControllerSummary,
  workoutControllerUpdateSet,
} from '@/shared/api/generated/workout/workout'

export type Workout = WorkoutResponseDto
export type WorkoutItem = Workout['exercises'][number]
export type WorkoutSet = WorkoutItem['sets'][number]
export type WorkoutAnalog = WorkoutAnalogResponseDto
export type WorkoutSummary = WorkoutSummaryResponseDto
export type Cooldown = CooldownResponseDto
export type CooldownStretch = Cooldown['main'][number]

export const workoutKeys = {
  current: ['workout', 'current'] as const,
  analogs: (itemId: number) => ['workout', 'analogs', itemId] as const,
  detail: (id: number) => ['workout', 'detail', id] as const,
  summary: (id: number) => ['workout', 'summary', id] as const,
  cooldown: (id: number) => ['workout', 'cooldown', id] as const,
}

/** Незавершённая тренировка: начатая в боте видна и тут (frontend-tz, 4.1) */
export const useCurrentWorkout = () =>
  useQuery({
    queryKey: workoutKeys.current,
    queryFn: () => workoutControllerCurrent(),
    // Подходы могли записать в боте, пока приложение было свёрнуто
    staleTime: 0,
  })

/** Любой ответ с тренировкой обновляет экран сразу, без повторного запроса */
const useApplyWorkout = () => {
  const queryClient = useQueryClient()
  return (workout: Workout) => {
    queryClient.setQueryData(workoutKeys.current, { workout })
    void queryClient.invalidateQueries({ queryKey: dayKeys.all })
  }
}

export const useStartWorkout = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (complexId?: number) => workoutControllerStart(complexId ? { complexId } : {}),
    // Экран тренировки открывается сам — он и есть подтверждение
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useAddSet = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (body: CreateWorkoutSetDto) => workoutControllerAddSet(body),
    // Подход сразу появляется в списке, а запускается таймер отдыха — тост лишний
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useUpdateSet = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateWorkoutSetDto & { id: number }) => workoutControllerUpdateSet(id, body),
    meta: { successMessage: 'Подход исправлен', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteSet = () => {
  const apply = useApplyWorkout()
  return useMutation({
    mutationFn: (id: number) => workoutControllerDeleteSet(id),
    meta: { successMessage: 'Подход удалён' },
    onSuccess: apply,
  })
}

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
    meta: { successMessage: 'Упражнение заменено' },
    onSuccess: apply,
  })
}

export const useFinishWorkout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workoutControllerFinish(id),
    meta: { successMessage: 'Тренировка засчитана ✅' },
    onSuccess: summary => {
      queryClient.setQueryData(workoutKeys.summary(summary.workoutId), summary)
      queryClient.setQueryData(workoutKeys.current, { workout: null })
      void queryClient.invalidateQueries({ queryKey: dayKeys.all })
      // Засчитанная тренировка меняет серию, посещаемость и веса
      void queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}

export const useDiscardWorkout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workoutControllerDiscard(id),
    meta: { successMessage: 'Тренировка отменена, очередь не сдвинулась' },
    onSuccess: () => {
      queryClient.setQueryData(workoutKeys.current, { workout: null })
      void queryClient.invalidateQueries({ queryKey: dayKeys.all })
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
