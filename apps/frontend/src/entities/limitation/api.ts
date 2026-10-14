import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import {
  limitationControllerCreate,
  limitationControllerList,
  limitationControllerRemove,
} from '@/shared/api/generated/limitation/limitation'
import type { CreateLimitationDto, LimitationResponseDto } from '@/shared/api/generated/model'

export type Limitation = LimitationResponseDto

export const limitationKeys = {
  list: ['limitation', 'list'] as const,
}

/** Действующие ограничения по суставам: подсветка ⚠️ в комплексе и карточке упражнения */
export const useLimitations = () =>
  useQuery({
    queryKey: limitationKeys.list,
    queryFn: () => limitationControllerList(),
  })

// Ограничение меняет ⚠️ в комплексе дня — «Сегодня» перечитываем
const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: limitationKeys.list })
    void queryClient.invalidateQueries({ queryKey: dayKeys.all })
  }
}

export const useCreateLimitation = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: CreateLimitationDto) => limitationControllerCreate(body),
    meta: { successMessage: 'Ограничение добавлено', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useDeleteLimitation = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => limitationControllerRemove(id),
    meta: { successMessage: 'Ограничение снято' },
    onSuccess: invalidate,
  })
}
