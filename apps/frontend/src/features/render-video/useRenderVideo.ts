import {
  type ChatState,
  chatStateOf,
  type CompositionId,
  type CompositionProps,
  COMPOSITIONS,
  type RenderFormat,
} from '@sportbot/render-contract'

import { type RenderJob, useOrderRender, useOrderRenderToChat, useRenderJobs } from '@sportbot/api/entities/render'
import { toAssetUrl } from '@/shared/api'
import { downloadFile } from '@/shared/miniapp'

/** Файл в этом формате для текущей формы: не заказан, в работе, готов, не получился */
export type FileState = 'idle' | 'pending' | 'ready' | 'failed'

export type RenderSlot = {
  file: FileState
  chat: ChatState
  job?: RenderJob
  /** Текст ошибки рендера или отправки */
  error?: string
}

// Postgres (jsonb) переставляет ключи props — сравниваем по значениям, а не по строке
const sortedJson = (value: unknown): string =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? `{${Object.keys(value)
        .sort()
        .map(key => `${JSON.stringify(key)}:${sortedJson((value as Record<string, unknown>)[key])}`)
        .join(',')}}`
    : JSON.stringify(value)

/** Состояние кнопок по задаче с сервера: в работе, готов, не получился */
export const slotOfJob = (job: RenderJob): RenderSlot => {
  const chat = chatStateOf(job)
  if (job.status === 'FAILED') return { file: 'failed', chat, job, error: job.error ?? 'Не получилось собрать ролик' }
  if (job.status === 'DONE')
    // Файл удалён по сроку хранения — можно заказать заново
    return job.url ? { file: 'ready', chat, job, error: job.chatError ?? undefined } : { file: 'idle', chat: 'idle' }
  return { file: 'pending', chat, job }
}

/** Скачать готовый файл. Только по нажатию: системный диалог мессенджера открывается лишь по жесту */
export const downloadRender = (job: RenderJob) => {
  if (job.url) downloadFile(toAssetUrl(job.url) ?? job.url, job.fileName ?? 'video')
}

/**
 * Рендер любой композиции контракта. Задача — это файл: один на props и формат. Поменяли текст —
 * кнопки снова «Сделать файл»; вернули прежний — снова видно готовый файл. «В чат» — просьба на
 * той же задаче: готовый файл бот пришлёт сразу, без нового рендера
 */
export const useRenderVideo = <Id extends CompositionId>(compositionId: Id, values: CompositionProps<Id>) => {
  const jobs = useRenderJobs(compositionId)
  const orderFile = useOrderRender()
  const orderChat = useOrderRenderToChat()

  // Сервер хранит props после схемы (trim и т.п.) — приводим форму к тому же виду
  const parsed = COMPOSITIONS[compositionId].schema.safeParse(values)
  const key = parsed.success ? sortedJson(parsed.data) : null

  const jobOf = (format: RenderFormat) =>
    key ? jobs.data?.find(job => job.format === format && sortedJson(job.props) === key) : undefined

  const slotOf = (format: RenderFormat): RenderSlot => {
    const job = jobOf(format)
    const ordering = orderFile.isPending && orderFile.variables?.format === format
    const askingChat = orderChat.isPending && orderChat.variables?.format === format
    const chat: ChatState = askingChat ? 'waiting' : job ? chatStateOf(job) : 'idle'

    if (!job) return { file: ordering || askingChat ? 'pending' : 'idle', chat }
    const slot = slotOfJob(job)
    // Файл удалён по сроку — задача для кнопок как бы не заказана
    return slot.job ? { ...slot, chat } : slot
  }

  const order = (format: RenderFormat, props: CompositionProps<Id>) =>
    orderFile.mutateAsync({ compositionId, format, props })

  const sendToChat = (format: RenderFormat, props: CompositionProps<Id>) =>
    orderChat.mutateAsync({ compositionId, format, props })

  return { slotOf, order, sendToChat, download: downloadRender }
}
