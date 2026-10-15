import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { onboardingKeys } from '@/entities/onboarding'
import { programKeys } from '@/entities/program'
import {
  programTagControllerCreate,
  programTagControllerList,
  programTagControllerRemove,
  programTagControllerReorder,
  programTagControllerUpdate,
} from '@/shared/api/generated/admin-program-tags/admin-program-tags'
import type { AdminProgramTagResponseDto, CreateProgramTagDto, UpdateProgramTagDto } from '@/shared/api/generated/model'

import { adminTemplateKeys } from './templates-api'

export type AdminProgramTag = AdminProgramTagResponseDto

export const programTagKeys = {
  all: ['admin-program-tags'] as const,
  list: ['admin-program-tags', 'list'] as const,
}

export const useProgramTags = () =>
  useQuery({
    queryKey: programTagKeys.list,
    queryFn: () => programTagControllerList(),
  })

// Тег виден в шаблонах админки, в «Шаблонах» и на шаге программы онбординга — обновляем всё
const useInvalidateTags = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: programTagKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all })
    void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    void queryClient.invalidateQueries({ queryKey: onboardingKeys.state })
  }
}

export const useCreateProgramTag = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (body: CreateProgramTagDto) => programTagControllerCreate(body),
    meta: { successMessage: 'Тег добавлен', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useUpdateProgramTag = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateProgramTagDto & { id: number }) => programTagControllerUpdate(id, body),
    meta: { successMessage: 'Тег сохранён', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useDeleteProgramTag = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (id: number) => programTagControllerRemove(id),
    meta: { successMessage: 'Тег удалён. Шаблоны остались' },
    onSuccess: invalidate,
  })
}

export const useReorderProgramTags = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (ids: number[]) => programTagControllerReorder({ ids }),
    // Новый порядок и так виден в списке — тост на каждую стрелку только мешал бы
    meta: { skipSuccessToast: true },
    onSuccess: tags => {
      queryClient.setQueryData(programTagKeys.list, tags)
      invalidate()
    },
  })
}
