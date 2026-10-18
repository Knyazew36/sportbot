export const RENDER_STATUSES = ['QUEUED', 'RENDERING', 'DONE', 'FAILED'] as const
export type RenderStatus = (typeof RENDER_STATUSES)[number]

/** CHAT — бот присылает файл в чат; DOWNLOAD — файл забирают из приложения по ссылке */
export const RENDER_DELIVERIES = ['CHAT', 'DOWNLOAD'] as const
export type RenderDelivery = (typeof RENDER_DELIVERIES)[number]

/** Пока задача в этих статусах — фронт опрашивает её, а новую пользователь не ставит */
export const isRenderActive = (status: RenderStatus) => status === 'QUEUED' || status === 'RENDERING'

export const RENDER_LIMITS = {
  /** Одновременно в работе у одного пользователя: по задаче на каждую кнопку формата */
  activePerUser: 3,
  perUserPerDay: 20,
  /** Сколько готовый файл лежит на сервере */
  fileTtlHours: 24,
}
