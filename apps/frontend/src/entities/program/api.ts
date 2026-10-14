import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import type {
  ProgramListItemResponseDto,
  ProgramResponseDto,
  UpdateComplexExerciseDto,
} from '@/shared/api/generated/model'
import {
  programControllerActivate,
  programControllerAddComplex,
  programControllerAddExercises,
  programControllerCreate,
  programControllerList,
  programControllerRemove,
  programControllerRemoveComplex,
  programControllerRemoveItem,
  programControllerReorderComplexes,
  programControllerReorderItems,
  programControllerResync,
  programControllerTake,
  programControllerTemplates,
  programControllerUpdate,
  programControllerUpdateComplex,
  programControllerUpdateItem,
  programControllerView,
} from '@/shared/api/generated/program/program'

export type Program = ProgramResponseDto
export type ProgramComplex = Program['complexes'][number]
export type ProgramExercise = ProgramComplex['exercises'][number]
export type ProgramListItem = ProgramListItemResponseDto

export const programKeys = {
  all: ['program'] as const,
  list: ['program', 'list'] as const,
  templates: ['program', 'templates'] as const,
  detail: (id: number) => ['program', 'detail', id] as const,
}

export const usePrograms = () =>
  useQuery({
    queryKey: programKeys.list,
    queryFn: () => programControllerList(),
  })

export const useProgram = (id: number | undefined) =>
  useQuery({
    queryKey: programKeys.detail(id ?? 0),
    queryFn: () => programControllerView(id!),
    // Нет активной программы — нечего запрашивать
    enabled: id != null,
  })

/** Активная программа целиком: по ней идёт очередь и в неё «Добавить в комплекс» */
export const useActiveProgram = () => {
  const list = usePrograms()
  return useProgram(list.data?.find(p => p.active)?.id)
}

/** Шаблоны с составом: их немного, приходят целиком — экран шаблона берёт свой из этого же списка */
export const useTemplates = () =>
  useQuery({
    queryKey: programKeys.templates,
    queryFn: () => programControllerTemplates(),
    staleTime: 5 * 60_000,
  })

/**
 * Любая правка возвращает программу целиком: кладём её в кэш без повторного запроса.
 * Список (название, число комплексов, активная) и «Сегодня» (комплекс по очереди) обновятся в фоне
 */
const useApplyProgram = () => {
  const queryClient = useQueryClient()
  return (program: Program) => {
    queryClient.setQueryData(programKeys.detail(program.id), program)
    void queryClient.invalidateQueries({ queryKey: programKeys.list })
    void queryClient.invalidateQueries({ queryKey: dayKeys.all })
  }
}

// ── Программа ───────────────────────────────────────────────────────────────

export const useCreateProgram = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (name: string) => programControllerCreate({ name }),
    meta: { successMessage: 'Программа создана' },
    onSuccess: apply,
  })
}

/** «Взять» шаблон — копия в программах пользователя */
export const useTakeTemplate = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (templateId: number) => programControllerTake(templateId),
    meta: { successMessage: 'Шаблон в твоих программах' },
    onSuccess: apply,
  })
}

export const useRenameProgram = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => programControllerUpdate(id, { name }),
    meta: { successMessage: 'Программа переименована', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => programControllerRemove(id),
    meta: { successMessage: 'Программа удалена, история тренировок осталась' },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: programKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: programKeys.list })
      void queryClient.invalidateQueries({ queryKey: dayKeys.all })
    },
  })
}

export const useActivateProgram = () => {
  const queryClient = useQueryClient()
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerActivate(id),
    meta: { successMessage: 'Программа активна' },
    onSuccess: program => {
      // У прежней активной сменились признак и «следующий по очереди» — её кэш устарел
      void queryClient.invalidateQueries({ queryKey: [...programKeys.all, 'detail'] })
      apply(program)
    },
  })
}

/** «Обновить у себя»: копия заменяется версией друга, свои правки пропадают */
export const useResyncProgram = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerResync(id),
    meta: { successMessage: 'Программа обновлена' },
    onSuccess: apply,
  })
}

// ── Комплексы ───────────────────────────────────────────────────────────────

export const useAddComplex = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ programId, name }: { programId: number; name: string }) =>
      programControllerAddComplex(programId, { name }),
    meta: { successMessage: 'Комплекс добавлен', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useRenameComplex = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => programControllerUpdateComplex(id, { name }),
    meta: { successMessage: 'Комплекс переименован', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteComplex = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerRemoveComplex(id),
    meta: { successMessage: 'Комплекс удалён' },
    onSuccess: apply,
  })
}

export const useReorderComplexes = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ programId, ids }: { programId: number; ids: number[] }) =>
      programControllerReorderComplexes(programId, { ids }),
    // Новый порядок уже на экране: карточку перетащили руками
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

// ── Упражнения комплекса ────────────────────────────────────────────────────

export const useAddComplexExercises = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ complexId, exerciseIds }: { complexId: number; exerciseIds: number[] }) =>
      programControllerAddExercises(complexId, { exerciseIds }),
    meta: { successMessage: 'Упражнения добавлены' },
    onSuccess: apply,
  })
}

export const useUpdateComplexExercise = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ id, ...plan }: UpdateComplexExerciseDto & { id: number }) => programControllerUpdateItem(id, plan),
    // Сохраняется при уходе из поля: новое «3 × 8–12» уже стоит в строке, тост на каждое поле мешал бы
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useDeleteComplexExercise = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerRemoveItem(id),
    meta: { successMessage: 'Упражнение убрано' },
    onSuccess: apply,
  })
}

export const useReorderComplexExercises = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ complexId, ids }: { complexId: number; ids: number[] }) =>
      programControllerReorderItems(complexId, { ids }),
    // Строка сдвигается на глазах — подтверждать нечего
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}
