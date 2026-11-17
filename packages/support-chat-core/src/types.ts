// Модель чата поддержки так, как её видит клиент API (JSON): даты — ISO-строки.

/** Статус обращения. OPEN — ждёт оператора, PENDING — ждёт клиента, RESOLVED — решено (клиент может переоткрыть), CLOSED — закрыто. */
export const SUPPORT_CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const
export type SupportConversationStatus = (typeof SUPPORT_CONVERSATION_STATUSES)[number]

/** Кто написал сообщение. SYSTEM — служебные строки («обращение закрыто»), BOT — автоответы. */
export const SUPPORT_MESSAGE_AUTHORS = ['CONTACT', 'OPERATOR', 'SYSTEM', 'BOT'] as const
export type SupportMessageAuthor = (typeof SUPPORT_MESSAGE_AUTHORS)[number]

/** Откуда пришло сообщение или обращение. */
export const SUPPORT_CHANNELS = ['WIDGET', 'TELEGRAM', 'MAX', 'VK'] as const
export type SupportChannel = (typeof SUPPORT_CHANNELS)[number]

/** Сторона диалога — для прочтений и «печатает…». */
export const SUPPORT_SIDES = ['CONTACT', 'OPERATOR'] as const
export type SupportSide = (typeof SUPPORT_SIDES)[number]

export interface SupportAttachment {
  id: number
  url: string
  name: string
  mime: string
  size: number
}

/** Цитата сообщения, на которое ответили: хватает, чтобы показать её и перейти к оригиналу. */
export interface SupportMessageReply {
  id: number
  seq: number
  author: SupportMessageAuthor
  authorName: string | null
  /** Начало текста; у удалённого — пустая строка. */
  text: string
  /** Сколько вложений — чтобы подписать цитату без текста («Фото»). */
  attachmentsCount: number
  deletedAt: string | null
}

export interface SupportMessage {
  id: number
  conversationId: number
  /** Порядок внутри диалога, монотонный, назначает сервер. По нему клиент находит пропуски. */
  seq: number
  author: SupportMessageAuthor
  /** CONTACT — id контакта, OPERATOR — id пользователя проекта. */
  authorId: number | null
  authorName: string | null
  /** У удалённого сообщения — пустая строка. */
  text: string
  /** Заметка операторов — клиенту никогда не приходит. */
  isInternalNote: boolean
  /** Ключ идемпотентности от клиента; по нему клиент склеивает своё неподтверждённое сообщение с пришедшим. */
  clientMessageId: string | null
  channel: SupportChannel
  attachments: SupportAttachment[]
  /** На что ответили; null — обычное сообщение или оригинал недоступен. */
  replyTo: SupportMessageReply | null
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
}

export interface SupportContact {
  id: number
  /** id пользователя проекта; null — анонимный посетитель. */
  externalUserId: string | null
  name: string | null
  email: string | null
  phone: string | null
  createdAt: string
}

export interface SupportConversation {
  id: number
  status: SupportConversationStatus
  contactId: number
  assigneeId: number | null
  assigneeName: string | null
  sourceChannel: SupportChannel
  /** seq последнего сообщения. */
  lastSeq: number
  lastMessageAt: string | null
  /** До какого seq прочитал клиент / операторы. */
  contactReadSeq: number
  operatorReadSeq: number
  unreadForContact: number
  /** Клиенту всегда 0. */
  unreadForOperator: number
  /** Клиенту всегда пустой. */
  tags: string[]
  /** Оценка клиента 1–5. */
  rating: number | null
  createdAt: string
  updatedAt: string
  /** Только у оператора и только по запросу. */
  contact?: SupportContact
  lastMessage?: SupportMessage | null
}

/** Ответ на вход в чат: токен визита для заголовка SUPPORT_VISIT_HEADER и сокета. */
export interface SupportSession {
  token: string
  expiresAt: string
  /** Ключ анонимного посетителя — клиент хранит его и передаёт при следующем входе. null — посетитель опознан. */
  anonymousKey: string | null
  contact: SupportContact
}

export interface SupportCursorMeta {
  /** Есть ещё сообщения в направлении запроса. */
  hasMore: boolean
}

export interface SupportCursorPage<T> {
  items: T[]
  meta: SupportCursorMeta
}
