import { isRenderActive, type RenderStatus } from '@sportbot/render-contract'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'

import type { CreateRenderJobDto, RenderJobResponseDto } from '@/shared/api/generated/model'
import { renderControllerCreate, renderControllerFindOne } from '@/shared/api/generated/render/render'

import { renderKeys } from './model/keys'

export type RenderJob = RenderJobResponseDto

/** Пока ролик в очереди или рендерится, задачу опрашиваем; готовую или упавшую — нет */
const POLL_MS = 2000

const useSeedJob = () => {
  const queryClient = useQueryClient()
  return (job: RenderJob) => queryClient.setQueryData(renderKeys.job(job.id), job)
}

/** Заказ ролика на скачивание: задачу дальше ведёт useRenderJobs */
export const useOrderRenderDownload = () => {
  const seed = useSeedJob()
  return useMutation({
    mutationFn: (dto: Omit<CreateRenderJobDto, 'delivery'>) => renderControllerCreate({ ...dto, delivery: 'DOWNLOAD' }),
    // Кнопка формата сама показывает «Готовим…» и «Скачать» — тост лишний
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: seed,
  })
}

/** Заказ ролика в чат: файл пришлёт бот, когда отрендерит */
export const useOrderRenderToChat = () => {
  const seed = useSeedJob()
  return useMutation({
    mutationFn: (dto: Omit<CreateRenderJobDto, 'delivery'>) => renderControllerCreate({ ...dto, delivery: 'CHAT' }),
    meta: { successMessage: 'Ролик готовится — бот пришлёт его в чат', inlineFieldErrors: true },
    onSuccess: seed,
  })
}

/** Статусы своих задач рендера; активные опрашиваются, пока не станут DONE или FAILED */
export const useRenderJobs = (ids: number[]) =>
  useQueries({
    queries: ids.map(id => ({
      queryKey: renderKeys.job(id),
      queryFn: () => renderControllerFindOne(id),
      refetchInterval: (query: { state: { data?: RenderJob } }) => {
        const status = query.state.data?.status as RenderStatus | undefined
        return status && isRenderActive(status) ? POLL_MS : false
      },
    })),
  })
