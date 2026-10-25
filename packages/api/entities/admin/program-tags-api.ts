import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { onboardingKeys } from '../onboarding'
import { programKeys } from '../program'
import {
  programTagGroupControllerCreate,
  programTagGroupControllerList,
  programTagGroupControllerRemove,
  programTagGroupControllerReorder,
  programTagGroupControllerUpdate,
} from '../../generated/admin-program-tag-groups/admin-program-tag-groups'
import {
  programTagControllerCreate,
  programTagControllerRemove,
  programTagControllerReorder,
  programTagControllerUpdate,
} from '../../generated/admin-program-tags/admin-program-tags'
import type {
  AdminProgramTagGroupResponseDto,
  AdminProgramTagResponseDto,
  CreateProgramTagDto,
  CreateProgramTagGroupDto,
  UpdateProgramTagDto,
  UpdateProgramTagGroupDto,
} from '../../generated/model'

import { adminTemplateKeys } from './templates-api'

export type AdminProgramTag = AdminProgramTagResponseDto
export type AdminProgramTagGroup = AdminProgramTagGroupResponseDto

export const programTagKeys = {
  all: ['admin-program-tags'] as const,
  groups: ['admin-program-tags', 'groups'] as const,
}

/** Группы тегов с тегами внутри — и для блока тегов, и для выбора тегов в редакторе шаблона */
export const useProgramTagGroups = () =>
  useQuery({
    queryKey: programTagKeys.groups,
    queryFn: () => programTagGroupControllerList(),
  })

// Теги и группы видны в шаблонах админки, в каталоге и на шаге программы онбординга — обновляем всё
const useInvalidateTags = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: programTagKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all })
    void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    void queryClient.invalidateQueries({ queryKey: programKeys.tagGroups })
    void queryClient.invalidateQueries({ queryKey: onboardingKeys.state })
  }
}

// ── Группы ──────────────────────────────────────────────────────────────────

export const useCreateProgramTagGroup = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (body: CreateProgramTagGroupDto) => programTagGroupControllerCreate(body),
    meta: { successMessage: 'Группа добавлена', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useUpdateProgramTagGroup = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateProgramTagGroupDto & { id: number }) =>
      programTagGroupControllerUpdate(id, body),
    meta: { successMessage: 'Группа сохранена', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useDeleteProgramTagGroup = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (id: number) => programTagGroupControllerRemove(id),
    meta: { successMessage: 'Группа удалена' },
    onSuccess: invalidate,
  })
}

export const useReorderProgramTagGroups = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (ids: number[]) => programTagGroupControllerReorder({ ids }),
    // Новый порядок и так виден в списке — тост на каждую стрелку только мешал бы
    meta: { skipSuccessToast: true },
    onSuccess: groups => {
      queryClient.setQueryData(programTagKeys.groups, groups)
      invalidate()
    },
  })
}

// ── Теги ────────────────────────────────────────────────────────────────────

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

/** ids — все теги одной группы в новом порядке */
export const useReorderProgramTags = () => {
  const invalidate = useInvalidateTags()
  return useMutation({
    mutationFn: (ids: number[]) => programTagControllerReorder({ ids }),
    // Новый порядок и так виден в списке — тост на каждую стрелку только мешал бы
    meta: { skipSuccessToast: true },
    onSuccess: invalidate,
  })
}
