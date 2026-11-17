/** Лимиты, общие для сервера и клиента: клиент проверяет до отправки, сервер — на границе. */
export const SUPPORT_LIMITS = {
  textMaxLength: 4000,
  attachmentsMax: 5,
  tagsMax: 20,
  tagMaxLength: 40,
  /** Сколько клиент может править и удалять своё сообщение. */
  messageEditWindowMs: 15 * 60 * 1000,
  /** «Печатает…» шлём не чаще. */
  typingThrottleMs: 3000,
  /** Сколько показывать «печатает…» после последнего события. */
  typingTimeoutMs: 6000,
  historyPageSize: 50,
  historyPageMax: 200,
  ratingMin: 1,
  ratingMax: 5,
} as const
