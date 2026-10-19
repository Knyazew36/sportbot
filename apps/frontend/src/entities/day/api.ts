import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { statsKeys } from '@/entities/stats'
import { PERSIST_GC_TIME } from '@/shared/api'
import {
  dayControllerEvening,
  dayControllerFix,
  dayControllerPickComplex,
  dayControllerReschedule,
  dayControllerSkip,
  dayControllerToday,
} from '@/shared/api/generated/day/day'
import type { DayFixDto, DayTodayResponseDto } from '@/shared/api/generated/model'

export type DayToday = DayTodayResponseDto

export const dayKeys = {
  all: ['day'] as const,
  today: () => ['day', 'today'] as const,
}

/** Сегодня: состояние дня */
export const useToday = () =>
  useQuery({
    queryKey: dayKeys.today(),
    queryFn: () => dayControllerToday(),
    // Без сети «Сегодня» показывает сохранённое состояние: оттуда «Продолжить» ведёт в тренировку
    meta: { persist: true },
    gcTime: PERSIST_GC_TIME,
  })

const useInvalidateDay = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: dayKeys.all })
}

/** «Другая тренировка»: выбор сохраняется на сервере и переживает перезаход */
export const usePickComplex = () => {
  const invalidate = useInvalidateDay()
  return useMutation({
    mutationFn: (complexId: number) => dayControllerPickComplex({ complexId }),
    // Новый комплекс сразу виден на экране дня
    meta: { skipSuccessToast: true },
    onSuccess: invalidate,
  })
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

/** Исправление отметки дня в пределах недели: меняет и «Сегодня», и календарь со статистикой */
export const useFixDay = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dayId, status }: { dayId: number; status: DayFixDto['status'] }) =>
      dayControllerFix(dayId, { status }),
    meta: { successMessage: 'Отметку исправил' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dayKeys.all })
      void queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}
