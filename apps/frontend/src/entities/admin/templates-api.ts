import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Program, programKeys } from '@/entities/program'
import {
  adminTemplatesControllerAddComplex,
  adminTemplatesControllerAddExercises,
  adminTemplatesControllerCreate,
  adminTemplatesControllerFromProgram,
  adminTemplatesControllerList,
  adminTemplatesControllerRemove,
  adminTemplatesControllerRemoveComplex,
  adminTemplatesControllerRemoveItem,
  adminTemplatesControllerReorder,
  adminTemplatesControllerReorderComplexes,
  adminTemplatesControllerReorderItems,
  adminTemplatesControllerUngroupItem,
  adminTemplatesControllerUngroupSuperset,
  adminTemplatesControllerUpdate,
  adminTemplatesControllerUpdateComplex,
  adminTemplatesControllerUpdateItem,
  adminTemplatesControllerView,
} from '@/shared/api/generated/admin-templates/admin-templates'
import type {
  AddComplexExercisesDto,
  CreateTemplateDto,
  UpdateComplexExerciseDto,
  UpdateTemplateDto,
} from '@/shared/api/generated/model'

export const adminTemplateKeys = {
  all: ['admin-templates'] as const,
  list: ['admin-templates', 'list'] as const,
  detail: (id: number) => ['admin-templates', 'detail', id] as const,
}

export const useAdminTemplates = () =>
  useQuery({
    queryKey: adminTemplateKeys.list,
    queryFn: () => adminTemplatesControllerList(),
  })

export const useAdminTemplate = (id: number) =>
  useQuery({
    queryKey: adminTemplateKeys.detail(id),
    queryFn: () => adminTemplatesControllerView(id),
  })

// Шаблон целиком в ответе любой правки; пользователи видят шаблоны в каталоге — его и чипы тоже обновляем
const useApplyTemplate = () => {
  const queryClient = useQueryClient()
  return (template: Program) => {
    queryClient.setQueryData(adminTemplateKeys.detail(template.id), template)
    void queryClient.invalidateQueries({ queryKey: adminTemplateKeys.list })
    void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    void queryClient.invalidateQueries({ queryKey: programKeys.tagGroups })
  }
}

export const useCreateTemplate = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: (body: CreateTemplateDto) => adminTemplatesControllerCreate(body),
    meta: { successMessage: 'Шаблон создан', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useUpdateTemplate = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTemplateDto & { id: number }) => adminTemplatesControllerUpdate(id, body),
    meta: { successMessage: 'Шаблон сохранён', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

/** Показать в каталоге или убрать из него: копии у пользователей не трогаются */
export const usePublishTemplate = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      adminTemplatesControllerUpdate(id, { isPublished }),
    meta: { successMessage: 'Видимость в каталоге сохранена' },
    onSuccess: apply,
  })
}

/** «Из моей программы»: скрытый шаблон с составом своей программы, оригинал остаётся */
export const useTemplateFromProgram = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: (programId: number) => adminTemplatesControllerFromProgram(programId),
    // Сразу открывается редактор нового шаблона — результат и так виден
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

/** ids — все шаблоны в новом порядке каталога */
export const useReorderTemplates = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => adminTemplatesControllerReorder({ ids }),
    // Новый порядок и так виден в списке — тост на каждую стрелку только мешал бы
    meta: { skipSuccessToast: true },
    onSuccess: templates => {
      queryClient.setQueryData(adminTemplateKeys.list, templates)
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminTemplatesControllerRemove(id),
    meta: { successMessage: 'Шаблон удалён' },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: adminTemplateKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: adminTemplateKeys.list })
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
      void queryClient.invalidateQueries({ queryKey: programKeys.tagGroups })
    },
  })
}

// ── Комплексы и упражнения шаблона ──────────────────────────────────────────

export const useAddTemplateComplex = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: number; name: string }) =>
      adminTemplatesControllerAddComplex(templateId, { name }),
    meta: { successMessage: 'Комплекс добавлен' },
    onSuccess: apply,
  })
}

export const useRenameTemplateComplex = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => adminTemplatesControllerUpdateComplex(id, { name }),
    meta: { successMessage: 'Комплекс переименован', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteTemplateComplex = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: (id: number) => adminTemplatesControllerRemoveComplex(id),
    meta: { successMessage: 'Комплекс удалён' },
    onSuccess: apply,
  })
}

export const useReorderTemplateComplexes = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ templateId, ids }: { templateId: number; ids: number[] }) =>
      adminTemplatesControllerReorderComplexes(templateId, { ids }),
    // Новый порядок уже на экране: карточку перетащили руками
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useAddTemplateExercises = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ complexId, ...dto }: AddComplexExercisesDto & { complexId: number }) =>
      adminTemplatesControllerAddExercises(complexId, dto),
    meta: { successMessage: 'Упражнения добавлены' },
    onSuccess: apply,
  })
}

export const useUngroupTemplateExercise = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: (id: number) => adminTemplatesControllerUngroupItem(id),
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useUngroupTemplateSuperset = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ complexId, superset }: { complexId: number; superset: number }) =>
      adminTemplatesControllerUngroupSuperset(complexId, { superset }),
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useUpdateTemplateExercise = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ id, ...plan }: UpdateComplexExerciseDto & { id: number }) =>
      adminTemplatesControllerUpdateItem(id, plan),
    // Сохраняется при уходе из поля: новое «3 × 8–12» уже стоит в строке
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteTemplateExercise = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: (id: number) => adminTemplatesControllerRemoveItem(id),
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useReorderTemplateExercises = () => {
  const apply = useApplyTemplate()
  return useMutation({
    mutationFn: ({ complexId, ids }: { complexId: number; ids: number[] }) =>
      adminTemplatesControllerReorderItems(complexId, { ids }),
    // Строка сдвигается на глазах — подтверждать нечего
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}
