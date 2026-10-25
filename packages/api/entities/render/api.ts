import { chatStateOf, type CompositionId, isRenderActive, type RenderStatus } from '@sportbot/render-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateRenderJobDto, RenderJobResponseDto } from '../../generated/model'
import { renderControllerCreate, renderControllerList, renderControllerRemove } from '../../generated/render/render'

import { renderKeys } from './model/keys'

export type RenderJob = RenderJobResponseDto

type OrderVars = Omit<CreateRenderJobDto, 'toChat'>

/** Пока что-то рендерится или ждёт отправки в чат — список опрашиваем, иначе нет */
const POLL_MS = 2000

const isBusy = (job: RenderJob) => isRenderActive(job.status as RenderStatus) || chatStateOf(job) === 'waiting'

/**
 * Свои файлы ролика за сутки: что готово, что в работе, что уже в чате. Состояние кнопок берётся
 * отсюда, а не из памяти экрана — переживает уход с экрана и перезапуск приложения.
 * Без compositionId — файлы всех роликов
 */
export const useRenderJobs = (compositionId?: CompositionId) =>
  useQuery({
    queryKey: renderKeys.list(compositionId),
    queryFn: () => renderControllerList(compositionId ? { compositionId } : undefined),
    refetchInterval: query => (query.state.data?.some(isBusy) ? POLL_MS : false),
    // Статус меняет воркер, а не пользователь: открыл экран — сразу свежий
    staleTime: 0,
  })

/**
 * Ответ заказа — та же задача, что придёт в списке: кладём её в список ролика и в общий, не дожидаясь
 * опроса. Общий трогаем, только если он уже загружен: иначе первым запросом он придёт с сервера целиком
 */
const useUpsertJob = () => {
  const queryClient = useQueryClient()
  const put = (jobs: RenderJob[] | undefined, job: RenderJob) => [
    job,
    ...(jobs ?? []).filter(item => item.id !== job.id),
  ]
  return (job: RenderJob) => {
    queryClient.setQueryData<RenderJob[]>(renderKeys.list(job.compositionId), jobs => put(jobs, job))
    queryClient.setQueryData<RenderJob[]>(renderKeys.list(), jobs => jobs && put(jobs, job))
  }
}

/** Файл ролика: такой же готов или в работе — сервер вернёт его, а не отрендерит заново */
export const useOrderRender = () => {
  const upsert = useUpsertJob()
  return useMutation({
    mutationFn: (dto: OrderVars) => renderControllerCreate(dto),
    // Кнопка формата сама показывает «Готовим…» и «Скачать» — тост лишний
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: upsert,
  })
}

/**
 * Удалить готовый файл раньше срока. Задача остаётся, только без ссылки — подменяем её на месте в обоих
 * списках: без файла она сама уходит из «Моих файлов», а кнопки формата снова «Сделать файл»
 */
export const useDeleteRenderFile = () => {
  const queryClient = useQueryClient()
  const replace = (jobs: RenderJob[] | undefined, job: RenderJob) =>
    jobs?.map(item => (item.id === job.id ? job : item))
  return useMutation({
    mutationFn: (id: number) => renderControllerRemove(id),
    meta: { successMessage: 'Файл удалён' },
    onSuccess: (job: RenderJob) => {
      queryClient.setQueryData<RenderJob[]>(renderKeys.list(job.compositionId), jobs => replace(jobs, job))
      queryClient.setQueryData<RenderJob[]>(renderKeys.list(), jobs => replace(jobs, job))
    },
  })
}

/** Прислать файл ботом в чат: готовый уйдёт сразу, в работе — как только будет готов */
export const useOrderRenderToChat = () => {
  const upsert = useUpsertJob()
  return useMutation({
    mutationFn: (dto: OrderVars) => renderControllerCreate({ ...dto, toChat: true }),
    meta: { successMessage: 'Бот пришлёт файл в чат', inlineFieldErrors: true },
    onSuccess: upsert,
  })
}
