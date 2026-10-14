import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  dayControllerEvening,
  dayControllerFix,
  dayControllerReschedule,
  dayControllerSkip,
  dayControllerToday,
} from '@/shared/api/generated/day/day'
import type { DayFixDto, DayTodayResponseDto } from '@/shared/api/generated/model'

export type DayToday = DayTodayResponseDto

export const dayKeys = {
  all: ['day'] as const,
  today: (complexId?: number) => ['day', 'today', complexId ?? null] as const,
}

/** Сегодня: состояние дня; complexId — «другой комплекс» вместо предложенного по очереди */
export const useToday = (complexId?: number) =>
  useQuery({
    queryKey: dayKeys.today(complexId),
    queryFn: () => dayControllerToday(complexId ? { complexId } : undefined),
    // Смена комплекса не мигает пустым экраном
    placeholderData: keepPreviousData,
  })

const useInvalidateDay = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: dayKeys.all })
}

/** «Сегодня не буду» — как утреннее «нет» в боте */
export const useSkipDay = () => {
  const invalidate = useInvalidateDay()
  return useMutation({
    mutationFn: () => dayControllerSkip(),
    meta: { successMessage: 'Записал пропуск' },
    onSuccess: invalidate,
  })
}

/** Вечерний ответ «потренировался сегодня?» */
export const useEveningAnswer = () => {
  const invalidate = useInvalidateDay()
  return useMutation({
    mutationFn: (yes: boolean) => dayControllerEvening({ yes }),
    // Итог — засчитано или пропуск — сразу виден на экране дня
    meta: { skipSuccessToast: true },
    onSuccess: invalidate,
  })
}

/** Ответ на «напомнить завтра?» */
export const useRescheduleAnswer = () => {
  const invalidate = useInvalidateDay()
  return useMutation({
    mutationFn: (accept: boolean) => dayControllerReschedule({ accept }),
    meta: { successMessage: 'Хорошо' },
    onSuccess: invalidate,
  })
}

/** Исправление отметки дня в пределах недели */
export const useFixDay = () => {
  const invalidate = useInvalidateDay()
  return useMutation({
    mutationFn: ({ dayId, status }: { dayId: number; status: DayFixDto['status'] }) =>
      dayControllerFix(dayId, { status }),
    meta: { successMessage: 'Отметку исправил' },
    onSuccess: invalidate,
  })
}
