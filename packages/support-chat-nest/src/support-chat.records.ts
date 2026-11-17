import type {
  SupportChannel,
  SupportConversationStatus,
  SupportMessageAuthor,
  SupportSide,
} from '@app/support-chat-core'

// Строки хранилища, какими их отдаёт SupportStore. Отличие от типов API — Date вместо строк
// и путь файла вместо публичного URL.

export interface SupportContactRecord {
  id: number
  workspaceKey: string
  externalUserId: string | null
  anonymousKey: string | null
  name: string | null
  email: string | null
  phone: string | null
  createdAt: Date
}

export interface SupportAttachmentRecord {
  id: number
  path: string
  name: string
  mime: string
  size: number
}

export interface SupportMessageReplyRecord {
  id: number
  seq: number
  author: SupportMessageAuthor
  authorName: string | null
  text: string
  isInternalNote: boolean
  deletedAt: Date | null
  attachmentsCount: number
}

export interface SupportMessageRecord {
  id: number
  conversationId: number
  seq: number
  author: SupportMessageAuthor
  authorId: number | null
  authorName: string | null
  text: string
  isInternalNote: boolean
  clientMessageId: string | null
  channel: SupportChannel
  editedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  attachments: SupportAttachmentRecord[]
  replyTo: SupportMessageReplyRecord | null
}

/** Сообщение вместе с контактом диалога — чтобы разослать событие о правке нужному посетителю. */
export type SupportMessageWithContact = SupportMessageRecord & { contactId: number }

export interface SupportConversationRecord {
  id: number
  workspaceKey: string
  contactId: number
  status: SupportConversationStatus
  assigneeId: number | null
  assigneeName: string | null
  sourceChannel: SupportChannel
  lastSeq: number
  lastMessageAt: Date | null
  contactReadSeq: number
  operatorReadSeq: number
  unreadForContact: number
  unreadForOperator: number
  tags: string[]
  rating: number | null
  createdAt: Date
  updatedAt: Date
  contact?: SupportContactRecord
  lastMessage?: SupportMessageRecord | null
}

export interface SupportContactInput {
  workspaceKey: string
  externalUserId?: string | null
  anonymousKey?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
}

export interface SupportContactPatch {
  name?: string | null
  email?: string | null
  phone?: string | null
}

export interface SupportConversationInput {
  workspaceKey: string
  contactId: number
  sourceChannel: SupportChannel
  status?: SupportConversationStatus
  assigneeId?: number | null
  assigneeName?: string | null
}

export interface SupportConversationPatch {
  status?: SupportConversationStatus
  assigneeId?: number | null
  assigneeName?: string | null
  tags?: string[]
  rating?: number | null
}

/** Где искать диалог: всегда в своём workspace, у посетителя — только свои. */
export interface SupportConversationScope {
  workspaceKey: string
  contactId?: number
}

export interface SupportMessageInput {
  author: SupportMessageAuthor
  authorId: number | null
  authorName: string | null
  text: string
  isInternalNote: boolean
  clientMessageId: string | null
  channel: SupportChannel
  /** Хранилище ставит ответ, только если оригинал в этом же диалоге и виден автору ответа. */
  replyToId: number | null
  attachments: Array<Omit<SupportAttachmentRecord, 'id'>>
}

/**
 * Что сделать с диалогом в той же транзакции, что и запись сообщения.
 * readBy — эта сторона прочитала всё до нового сообщения включительно (автор видит своё сообщение).
 * unreadFor — у этой стороны +1 непрочитанное.
 * assignIfUnassigned — назначить исполнителя, только если его ещё нет (первый ответивший оператор).
 */
export interface SupportMessageEffects {
  readBy?: SupportSide
  unreadFor?: SupportSide
  status?: SupportConversationStatus
  assignIfUnassigned?: { id: number; name: string | null }
}

export interface SupportAppendResult {
  conversation: SupportConversationRecord
  message: SupportMessageRecord
  /** false — сообщение с таким clientMessageId уже было, вернули его (повтор запроса). */
  created: boolean
}

/** Какое сообщение разрешено найти/править/удалять — проверяется прямо в where запроса. */
export interface SupportMessageScope {
  workspaceKey: string
  contactId?: number
  author?: SupportMessageAuthor
  authorId?: number
  createdAfter?: Date
  includeInternal: boolean
}

export interface SupportMessageListQuery {
  conversationId: number
  scope: SupportConversationScope
  /** Сообщения с seq меньше (листание истории вверх). */
  beforeSeq?: number
  /** Сообщения с seq больше (добор после обрыва). */
  afterSeq?: number
  limit: number
  includeInternal: boolean
}

export interface SupportConversationListQuery {
  workspaceKey: string
  page: number
  limit: number
  status?: SupportConversationStatus[]
  /** Число — назначен на оператора, null — без исполнителя. */
  assigneeId?: number | null
  channel?: SupportChannel
  search?: string
  withContact: boolean
  withLastMessage: boolean
}

export interface SupportPage<T> {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}
