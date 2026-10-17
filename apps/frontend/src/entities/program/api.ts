import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dayKeys } from '@/entities/day'
import type {
  AddComplexExercisesDto,
  ProgramListItemResponseDto,
  ProgramResponseDto,
  ProgramTagGroupResponseDto,
  PublishProgramDto,
  UpdateComplexExerciseDto,
} from '@/shared/api/generated/model'
import {
  programControllerActivate,
  programControllerAddComplex,
  programControllerAddExercises,
  programControllerCreate,
  programControllerDismissUpdate,
  programControllerList,
  programControllerMakeNextComplex,
  programControllerPublish,
  programControllerRemove,
  programControllerRemoveComplex,
  programControllerRemoveItem,
  programControllerReorderComplexes,
  programControllerReorderItems,
  programControllerResync,
  programControllerTagGroups,
  programControllerTake,
  programControllerTemplates,
  programControllerUngroupItem,
  programControllerUngroupSuperset,
  programControllerUnpublish,
  programControllerUpdate,
  programControllerUpdateComplex,
  programControllerUpdateItem,
  programControllerView,
} from '@/shared/api/generated/program/program'

export type Program = ProgramResponseDto
export type ProgramComplex = Program['complexes'][number]
export type ProgramExercise = ProgramComplex['exercises'][number]
export type ProgramListItem = ProgramListItemResponseDto
export type ProgramTagGroup = ProgramTagGroupResponseDto

/** Таб каталога: шаблоны администратора или программы пользователей */
export type CatalogSource = 'templates' | 'users'

/** Фильтр каталога: таб, id выбранных тегов (по одному на группу) и строка поиска */
export type TemplateFilters = { source?: CatalogSource; tagIds?: number[]; search?: string }

export const programKeys = {
  all: ['program'] as const,
  list: ['program', 'list'] as const,
  templates: ['program', 'templates'] as const,
  catalog: (filters: TemplateFilters) => ['program', 'templates', filters] as const,
  tagGroups: ['program', 'tag-groups'] as const,
  allTagGroups: ['program', 'tag-groups', 'all'] as const,
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

/**
 * Каталог шаблонов с составом. Без фильтра — весь каталог: экран шаблона берёт свой из этого списка.
 * Пока грузится новая выборка, на экране остаётся прежняя — чипы не мигают пустым списком
 */
export const useTemplates = (filters: TemplateFilters = {}) =>
  useQuery({
    queryKey: programKeys.catalog(filters),
    queryFn: () =>
      programControllerTemplates({
        filter_source: filters.source,
        filter_search: filters.search || undefined,
        filter_tags: filters.tagIds?.length ? filters.tagIds.join(',') : undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })

/** Ряды чипов каталога: группы с тегами, у которых есть опубликованные шаблоны */
export const useTemplateTagGroups = () =>
  useQuery({
    queryKey: programKeys.tagGroups,
    queryFn: () => programControllerTagGroups(),
    staleTime: 5 * 60_000,
  })

/** Все теги справочника по группам: форма публикации требует тег из каждой группы */
export const useAllTagGroups = () =>
  useQuery({
    queryKey: programKeys.allTagGroups,
    queryFn: () => programControllerTagGroups({ filter_all: true }),
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
    // Сразу открывается редактор новой программы — результат и так виден
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

/** «Взять» из каталога — копия в программах пользователя; в каталоге станет «уже у тебя» */
export const useTakeTemplate = () => {
  const queryClient = useQueryClient()
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (templateId: number) => programControllerTake(templateId),
    meta: { successMessage: 'Программа в твоих программах' },
    onSuccess: program => {
      apply(program)
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    },
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

/** «Обновить у себя»: копия заменяется версией друга или шаблона, свои правки пропадают */
export const useResyncProgram = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerResync(id),
    meta: { successMessage: 'Программа обновлена' },
    onSuccess: apply,
  })
}

/** «Не сейчас» на плашке обновления: вернётся после следующей правки источника */
export const useDismissProgramUpdate = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerDismissUpdate(id),
    // Плашка исчезает с экрана — это и есть ответ
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

// ── Публикация ──────────────────────────────────────────────────────────────

/** «Опубликовать» или «Изменить публикацию»: описание и теги уходят на проверку администратору */
export const usePublishProgram = () => {
  const queryClient = useQueryClient()
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ id, ...body }: PublishProgramDto & { id: number }) => programControllerPublish(id, body),
    meta: { successMessage: 'Отправлено на проверку', inlineFieldErrors: true },
    onSuccess: program => {
      apply(program)
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
      // Новый свой тег мог совпасть с тегом справочника — ряды чипов формы обновятся
      void queryClient.invalidateQueries({ queryKey: programKeys.allTagGroups })
    },
  })
}

export const useUnpublishProgram = () => {
  const queryClient = useQueryClient()
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerUnpublish(id),
    meta: { successMessage: 'Снята с публикации' },
    onSuccess: program => {
      apply(program)
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
    },
  })
}

// ── Комплексы ───────────────────────────────────────────────────────────────

export const useAddComplex = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ programId, name }: { programId: number; name: string }) =>
      programControllerAddComplex(programId, { name }),
    // После добавления сразу открывается страница нового комплекса — результат и так виден
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: apply,
  })
}

/** Ручной выбор следующего в очереди: подсветка на «Программах» и комплекс дня на «Сегодня» */
export const useMakeNextComplex = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerMakeNextComplex(id),
    meta: { successMessage: 'Комплекс следующий в очереди' },
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
    mutationFn: ({ complexId, ...dto }: AddComplexExercisesDto & { complexId: number }) =>
      programControllerAddExercises(complexId, dto),
    meta: { successMessage: 'Упражнения добавлены' },
    onSuccess: apply,
  })
}

export const useUngroupComplexExercise = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: (id: number) => programControllerUngroupItem(id),
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
    onSuccess: apply,
  })
}

export const useUngroupSuperset = () => {
  const apply = useApplyProgram()
  return useMutation({
    mutationFn: ({ complexId, superset }: { complexId: number; superset: number }) =>
      programControllerUngroupSuperset(complexId, { superset }),
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
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
    // Плашку «Отменить» показывает редактор комплекса (useComplexEditing) — тост дублировал бы её
    meta: { skipSuccessToast: true },
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
