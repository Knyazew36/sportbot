import type { CompositionId, CompositionProps, RenderFormat } from '@sportbot/render-contract'

import { useState } from 'react'

import { type RenderJob, useOrderRenderDownload, useOrderRenderToChat, useRenderJobs } from '@/entities/render'
import { toAssetUrl } from '@/shared/api'
import { downloadFile } from '@/shared/miniapp'

/** Что показать на кнопке формата */
export type RenderSlot =
  { state: 'idle' } | { state: 'pending' } | { state: 'ready'; job: RenderJob } | { state: 'failed'; error: string }

// Задача привязана к формату и к props: поменяли текст — старый файл уже не тот, кнопка снова «Скачать»
const slotKey = (format: RenderFormat, props: unknown) => `${format}:${JSON.stringify(props)}`

/**
 * Рендер любой композиции контракта: заказать файл в нужном формате, дождаться и скачать — или
 * попросить бота прислать его в чат. Экран отдаёт только props и форматы.
 */
export const useRenderVideo = <Id extends CompositionId>(compositionId: Id, props: CompositionProps<Id>) => {
  const [jobIds, setJobIds] = useState<Record<string, number>>({})
  const orderDownload = useOrderRenderDownload()
  const orderToChat = useOrderRenderToChat()
  const jobs = useRenderJobs(Object.values(jobIds))

  const jobOf = (format: RenderFormat) => {
    const id = jobIds[slotKey(format, props)]
    return id ? jobs.find(query => query.data?.id === id)?.data : undefined
  }

  const slotOf = (format: RenderFormat): RenderSlot => {
    const job = jobOf(format)
    const ordering = orderDownload.isPending && orderDownload.variables?.format === format
    if (!job) return ordering ? { state: 'pending' } : { state: 'idle' }
    if (job.status === 'DONE' && job.url) return { state: 'ready', job }
    if (job.status === 'FAILED' || job.status === 'DONE')
      return { state: 'failed', error: job.error ?? 'Файл больше недоступен — закажи заново' }
    return { state: 'pending' }
  }

  /** Заказать файл; повторный заказ тех же props сервер вернёт уже готовым */
  const order = (format: RenderFormat, values: CompositionProps<Id>) =>
    orderDownload.mutateAsync({ compositionId, format, props: values }).then(job => {
      setJobIds(ids => ({ ...ids, [slotKey(format, values)]: job.id }))
      return job
    })

  // Скачивание — отдельным нажатием: системный диалог мессенджера открывается только по жесту
  const download = (job: RenderJob) => {
    if (job.url) downloadFile(toAssetUrl(job.url) ?? job.url, job.fileName ?? 'video')
  }

  const sendToChat = (format: RenderFormat, values: CompositionProps<Id>) =>
    orderToChat.mutateAsync({ compositionId, format, props: values })

  return { slotOf, order, download, sendToChat, isSending: orderToChat.isPending }
}
