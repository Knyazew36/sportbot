import { chatStateOf, type CompositionId, isRenderActive, type RenderStatus } from '@sportbot/render-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateRenderJobDto, RenderJobResponseDto } from '@/shared/api/generated/model'
import { renderControllerCreate, renderControllerList } from '@/shared/api/generated/render/render'

import { renderKeys } from './model/keys'

export type RenderJob = RenderJobResponseDto

type OrderVars = Omit<CreateRenderJobDto, 'toChat'>

/** Пока что-то рендерится или ждёт отправки в чат — список опрашиваем, иначе нет */
const POLL_MS = 2000

const isBusy = (job: RenderJob) => isRenderActive(job.status as RenderStatus) || chatStateOf(job) === 'waiting'

/**
 * Свои файлы ролика за сутки: что готово, что в работе, что уже в чате. Состояние кнопок берётся
 * отсюда, а не из памяти экрана — переживает уход с экрана и перезапуск приложения
 */
export const useRenderJobs = (compositionId: CompositionId) =>
  useQuery({
    queryKey: renderKeys.list(compositionId),
    queryFn: () => renderControllerList({ compositionId }),
    refetchInterval: query => (query.state.data?.some(isBusy) ? POLL_MS : false),
    // Статус меняет воркер, а не пользователь: открыл экран — сразу свежий
    staleTime: 0,
  })

/** Ответ заказа — та же задача, что придёт в списке: кладём её туда, не дожидаясь опроса */
const useUpsertJob = () => {
  const queryClient = useQueryClient()
  return (job: RenderJob) =>
    queryClient.setQueryData<RenderJob[]>(renderKeys.list(job.compositionId), jobs => [
      job,
      ...(jobs ?? []).filter(item => item.id !== job.id),
    ])
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

/** Прислать файл ботом в чат: готовый уйдёт сразу, в работе — как только будет готов */
export const useOrderRenderToChat = () => {
  const upsert = useUpsertJob()
  return useMutation({
    mutationFn: (dto: OrderVars) => renderControllerCreate({ ...dto, toChat: true }),
    meta: { successMessage: 'Бот пришлёт файл в чат', inlineFieldErrors: true },
    onSuccess: upsert,
  })
}
