import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'

import type { SupportCursorMetaDto, SupportMessageDto } from '../dto'
import { SupportFileStorage, SupportStore } from '../ports'
import { SUPPORT_LOG_EMOJI } from '../support-chat.constants'
import type {
  SupportAppendResult,
  SupportConversationRecord,
  SupportConversationScope,
  SupportMessageEffects,
  SupportMessageInput,
} from '../support-chat.records'

import { SupportChatMapper } from './support-chat.mapper'
import { SupportEvents } from './support-events'

const ATTACHMENT_NAME_MAX = 200

export interface SupportPostParams {
  conversationId: number
  scope: SupportConversationScope
  input: Omit<SupportMessageInput, 'attachments'>
  effects: SupportMessageEffects
  files: Express.Multer.File[]
  /** Не пишутся в БД — только в событие message.created */
  actions?: string[]
}

export interface SupportHistoryParams {
  conversationId: number
  scope: SupportConversationScope
  beforeSeq?: number
  afterSeq?: number
  limit?: number
  includeInternal: boolean
}

/** Общее для посетителя и оператора: запись сообщения с вложениями и чтение истории. */
@Injectable()
export class SupportMessagingService {
  private readonly logger = new Logger(`${SUPPORT_LOG_EMOJI} ${SupportMessagingService.name}`)

  constructor(
    private readonly store: SupportStore,
    private readonly files: SupportFileStorage,
    private readonly events: SupportEvents,
    private readonly mapper: SupportChatMapper,
  ) {}

  // ── Сообщения ──────────────────────────────────────────────────────────────

  public async post(params: SupportPostParams): Promise<SupportAppendResult> {
    const { conversationId, scope, input, effects, files, actions } = params
    if (!input.text && files.length === 0) {
      throw new BadRequestException('Напишите текст или приложите файл')
    }

    // Файлы проверяются до записи в БД; при ошибке ниже их уберёт SupportFilesInterceptor
    const attachments = files.map(file => ({
      path: this.files.prepare(file),
      name: this.attachmentName(file),
      mime: file.mimetype,
      size: file.size,
    }))

    const result = await this.store.appendMessage(conversationId, scope, { ...input, attachments }, effects)
    if (!result) {
      throw new NotFoundException('Диалог не найден')
    }

    if (!result.created) {
      // Повтор запроса: сообщение уже есть, новые копии файлов не нужны
      files.forEach(file => this.files.discard(file))
      this.logger.log(
        `Повтор отправки conversationId=${conversationId} messageId=${result.message.id} clientMessageId=${input.clientMessageId}`,
      )
      return result
    }

    files.forEach(file => this.files.commit(file))
    this.logger.log(
      `Сообщение conversationId=${conversationId} messageId=${result.message.id} seq=${result.message.seq} автор=${input.author}${input.authorId ? `#${input.authorId}` : ''} канал=${input.channel} файлов=${files.length}${actions?.length ? ` кнопки=${actions.join(',')}` : ''}${input.isInternalNote ? ' заметка' : ''}`,
    )
    this.events.emit({
      type: 'message.created',
      conversation: result.conversation,
      message: result.message,
      ...(actions?.length ? { actions } : {}),
    })
    return result
  }

  /**
   * Служебная строка в ленте («обращение закрыто»). Основное действие к этому моменту уже выполнено,
   * поэтому сбой только логируем — не откатывать же из-за него смену статуса.
   */
  public async postSystem(conversation: SupportConversationRecord, text: string): Promise<SupportConversationRecord> {
    try {
      const result = await this.post({
        conversationId: conversation.id,
        scope: { workspaceKey: conversation.workspaceKey },
        input: {
          author: 'SYSTEM',
          authorId: null,
          authorName: null,
          text,
          isInternalNote: false,
          clientMessageId: null,
          replyToId: null,
          channel: conversation.sourceChannel,
        },
        effects: {},
        files: [],
      })
      return result.conversation
    } catch (error) {
      this.logger.error(
        `Не удалось записать служебное сообщение conversationId=${conversation.id}`,
        error instanceof Error ? error.stack : error,
      )
      return conversation
    }
  }

  public async history(
    params: SupportHistoryParams,
  ): Promise<{ items: SupportMessageDto[]; meta: SupportCursorMetaDto }> {
    if (params.beforeSeq !== undefined && params.afterSeq !== undefined) {
      throw new BadRequestException('Укажите либо beforeSeq, либо afterSeq')
    }

    const { items, hasMore } = await this.store.listMessages({
      conversationId: params.conversationId,
      scope: params.scope,
      beforeSeq: params.beforeSeq,
      afterSeq: params.afterSeq,
      limit: params.limit ?? SUPPORT_LIMITS.historyPageSize,
      includeInternal: params.includeInternal,
    })
    this.logger.debug(
      `История conversationId=${params.conversationId} before=${params.beforeSeq ?? '-'} after=${params.afterSeq ?? '-'}: ${items.length}, ещё=${hasMore}`,
    )
    return { items: items.map(item => this.mapper.message(item)), meta: { hasMore } }
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  /** multer отдаёт имя файла в latin1 — возвращаем UTF-8, иначе кириллица превращается в кракозябры. */
  private attachmentName(file: Express.Multer.File): string {
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8').trim() || 'file'
    return name.slice(0, ATTACHMENT_NAME_MAX)
  }
}
