export const RENDER_STATUSES = ['QUEUED', 'RENDERING', 'DONE', 'FAILED'] as const
export type RenderStatus = (typeof RENDER_STATUSES)[number]

/** Пока задача в этих статусах — фронт опрашивает её, а повторный заказ вернёт её же */
export const isRenderActive = (status: RenderStatus) => status === 'QUEUED' || status === 'RENDERING'

/** «В чат»: не просили, ждём (рендер или отправку), отправлено, не смогли */
export type ChatState = 'idle' | 'waiting' | 'sent' | 'failed'

export const chatStateOf = (job: {
  chatRequestedAt: string | Date | null
  deliveredAt: string | Date | null
  chatError: string | null
}): ChatState => {
  if (job.chatError) return 'failed'
  if (job.deliveredAt) return 'sent'
  return job.chatRequestedAt ? 'waiting' : 'idle'
}

export const RENDER_LIMITS = {
  /** Одновременно в работе у одного пользователя: по задаче на каждую кнопку формата */
  activePerUser: 3,
  perUserPerDay: 20,
  /** Задач в очереди на всех: дальше новые не принимаем, чтобы ожидание не росло бесконечно */
  queueMax: 30,
  /** Дольше этого один рендер не живёт: зависший Chrome не держит очередь */
  renderTimeoutSec: 120,
  /** Сколько готовый файл лежит на сервере */
  fileTtlHours: 24,
}
