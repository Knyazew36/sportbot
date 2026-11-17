import type { SupportSide } from '@app/support-chat-core'

import type {
  SupportAppendResult,
  SupportContactInput,
  SupportContactPatch,
  SupportContactRecord,
  SupportConversationInput,
  SupportConversationListQuery,
  SupportConversationPatch,
  SupportConversationRecord,
  SupportConversationScope,
  SupportMessageEffects,
  SupportMessageInput,
  SupportMessageListQuery,
  SupportMessageRecord,
  SupportMessageScope,
  SupportMessageWithContact,
  SupportPage,
} from '../support-chat.records'

/**
 * Хранилище чата — единственное, что модулю нужно от БД проекта. Эталонная схема Prisma —
 * prisma/support.prisma в пакете.
 *
 * Соглашение: «не найдено» (в том числе не прошло фильтр scope) — null, а не исключение.
 * Модуль сам превращает null в понятную ошибку. Принадлежность проверяется в where
 * той же мутации, а не отдельным запросом.
 */
export abstract class SupportStore {
  // ── Контакты ───────────────────────────────────────────────────────────────

  public abstract findContactByAnonymousKey(
    workspaceKey: string,
    anonymousKey: string,
  ): Promise<SupportContactRecord | null>

  /** Найти контакт пользователя проекта или завести; patch обновляет имя/почту/телефон. */
  public abstract upsertContactByExternalUserId(
    workspaceKey: string,
    externalUserId: string,
    patch: SupportContactPatch,
  ): Promise<SupportContactRecord>

  public abstract createContact(input: SupportContactInput): Promise<SupportContactRecord>

  /** Обновить имя/почту/телефон (форма перед чатом у анонима). null — контакта нет. */
  public abstract updateContact(
    id: number,
    workspaceKey: string,
    patch: SupportContactPatch,
  ): Promise<SupportContactRecord | null>

  /** Перенести диалоги анонимного контакта к опознанному и удалить анонимный. */
  public abstract mergeContacts(fromId: number, intoId: number): Promise<void>

  // ── Диалоги ────────────────────────────────────────────────────────────────

  public abstract findConversation(
    id: number,
    scope: SupportConversationScope,
    options?: { withContact?: boolean },
  ): Promise<SupportConversationRecord | null>

  /** Последний незакрытый (status ≠ CLOSED) диалог контакта. */
  public abstract findActiveConversation(
    contactId: number,
    workspaceKey: string,
  ): Promise<SupportConversationRecord | null>

  public abstract listConversations(
    query: SupportConversationListQuery,
  ): Promise<SupportPage<SupportConversationRecord>>

  /** null — контакта нет в этом workspace. */
  public abstract createConversation(input: SupportConversationInput): Promise<SupportConversationRecord | null>

  public abstract updateConversation(
    id: number,
    scope: SupportConversationScope,
    patch: SupportConversationPatch,
  ): Promise<SupportConversationRecord | null>

  /** Удаляет диалог вместе с сообщениями; возвращает пути вложений, чтобы удалить файлы. */
  public abstract deleteConversation(
    id: number,
    scope: SupportConversationScope,
  ): Promise<{ conversation: SupportConversationRecord; attachmentPaths: string[] } | null>

  /**
   * Прочитано стороной до seq: readSeq = max(текущий, min(seq, lastSeq)), счётчик непрочитанного
   * этой стороны пересчитывается. null — диалог не найден в scope.
   */
  public abstract markRead(
    conversationId: number,
    scope: SupportConversationScope,
    side: SupportSide,
    seq: number,
  ): Promise<SupportConversationRecord | null>

  // ── Сообщения ──────────────────────────────────────────────────────────────

  /**
   * Записать сообщение атомарно с обновлением диалога: seq = ++lastSeq (под блокировкой строки
   * диалога), lastMessageAt, effects. Повтор с тем же clientMessageId в этом диалоге не создаёт
   * дубль — возвращает существующее с created = false. null — диалог не найден в scope.
   */
  public abstract appendMessage(
    conversationId: number,
    scope: SupportConversationScope,
    input: SupportMessageInput,
    effects: SupportMessageEffects,
  ): Promise<SupportAppendResult | null>

  /** По возрастанию seq. Диалог не в scope — пустой список. */
  public abstract listMessages(
    query: SupportMessageListQuery,
  ): Promise<{ items: SupportMessageRecord[]; hasMore: boolean }>

  public abstract findMessage(id: number, scope: SupportMessageScope): Promise<SupportMessageWithContact | null>

  /** Правка текста, если сообщение проходит scope и не удалено. */
  public abstract updateMessageText(
    id: number,
    scope: SupportMessageScope,
    text: string,
  ): Promise<SupportMessageWithContact | null>

  /** Мягкое удаление, если сообщение проходит scope и ещё не удалено. */
  public abstract softDeleteMessage(id: number, scope: SupportMessageScope): Promise<SupportMessageWithContact | null>
}
