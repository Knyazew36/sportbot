import type { SupportChannel, SupportConversationStatus } from '@app/support-chat-core'
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'

import type {
  CreateSupportConversationDto,
  CreateSupportOperatorMessageDto,
  ListSupportConversationsQueryDto,
  ListSupportMessagesQueryDto,
  MarkSupportReadDto,
  SupportConversationDto,
  SupportMessageDto,
  UpdateSupportConversationDto,
  UpdateSupportMessageDto,
} from '../dto'
import { SupportFileStorage, SupportIdentity, type SupportOperator, SupportStore } from '../ports'
import { SUPPORT_CHAT_OPTIONS, SUPPORT_LOG_EMOJI } from '../support-chat.constants'
import type { SupportChatResolvedOptions } from '../support-chat.options'
import type { SupportConversationPatch, SupportMessageScope, SupportPage } from '../support-chat.records'

import { SupportChatMapper } from './support-chat.mapper'
import { SupportEvents } from './support-events'
import { SupportMessagingService } from './support-messaging.service'

/** Что увидит клиент в ленте при смене статуса оператором. */
const STATUS_SYSTEM_TEXT: Partial<Record<SupportConversationStatus, string>> = {
  OPEN: 'Обращение снова открыто',
  RESOLVED: 'Обращение отмечено как решённое',
  CLOSED: 'Обращение закрыто',
}

/** Сторона оператора: инбокс, управление диалогами, ответы и заметки. */
@Injectable()
export class SupportOperatorService {
  private readonly logger = new Logger(`${SUPPORT_LOG_EMOJI} ${SupportOperatorService.name}`)

  constructor(
    @Inject(SUPPORT_CHAT_OPTIONS) private readonly options: SupportChatResolvedOptions,
    private readonly store: SupportStore,
    private readonly identity: SupportIdentity,
    private readonly files: SupportFileStorage,
    private readonly messaging: SupportMessagingService,
    private readonly events: SupportEvents,
    private readonly mapper: SupportChatMapper,
  ) {}

  // ── Диалоги ────────────────────────────────────────────────────────────────

  public async listConversations(
    operator: SupportOperator,
    query: ListSupportConversationsQueryDto,
  ): Promise<SupportPage<SupportConversationDto>> {
    const assignee = query.filter_assignee
    const result = await this.store.listConversations({
      workspaceKey: this.options.workspaceKey,
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      status: query.filter_status,
      assigneeId:
        assignee === undefined
          ? undefined
          : assignee === 'me'
            ? operator.id
            : assignee === 'none'
              ? null
              : Number(assignee),
      channel: query.filter_channel,
      search: query.search,
      withContact: query.add_contact ?? false,
      withLastMessage: query.add_last_message ?? false,
    })
    this.logger.log(`Список диалогов operatorId=${operator.id}: найдено ${result.meta.total}`)
    return { ...result, items: result.items.map(item => this.mapper.conversation(item, 'operator')) }
  }

  public async getConversation(id: number): Promise<SupportConversationDto> {
    const conversation = await this.store.findConversation(id, this.scope(), { withContact: true })
    if (!conversation) {
      throw new NotFoundException('Диалог не найден')
    }
    return this.mapper.conversation(conversation, 'operator')
  }

  /** Оператор пишет клиенту первым: диалог сразу на нём и ждёт ответа клиента. */
  public async createConversation(
    operator: SupportOperator,
    dto: CreateSupportConversationDto,
  ): Promise<SupportConversationDto> {
    let conversation = await this.store.createConversation({
      workspaceKey: this.options.workspaceKey,
      contactId: dto.contactId,
      sourceChannel: 'WIDGET',
      status: 'PENDING',
      assigneeId: operator.id,
      assigneeName: operator.name,
    })
    if (!conversation) {
      throw new NotFoundException('Контакт не найден')
    }
    this.logger.log(`Оператор operatorId=${operator.id} открыл диалог id=${conversation.id} contactId=${dto.contactId}`)
    this.events.emit({ type: 'conversation.updated', conversation })

    if (dto.text) {
      const result = await this.messaging.post({
        conversationId: conversation.id,
        scope: this.scope(),
        input: this.operatorInput(operator, { text: dto.text }),
        effects: { readBy: 'OPERATOR', unreadFor: 'CONTACT' },
        files: [],
      })
      conversation = result.conversation
    }
    return this.mapper.conversation(conversation, 'operator')
  }

  public async updateConversation(
    operator: SupportOperator,
    id: number,
    dto: UpdateSupportConversationDto,
  ): Promise<SupportConversationDto> {
    const patch: SupportConversationPatch = { status: dto.status, tags: dto.tags }
    let assignee: SupportOperator | null = null
    if (dto.assigneeId === null) {
      patch.assigneeId = null
      patch.assigneeName = null
    } else if (dto.assigneeId !== undefined) {
      assignee = dto.assigneeId === operator.id ? operator : await this.identity.findOperator(dto.assigneeId)
      if (!assignee) {
        throw new BadRequestException('Оператор не найден')
      }
      patch.assigneeId = assignee.id
      patch.assigneeName = assignee.name
    }

    let conversation = await this.store.updateConversation(id, this.scope(), patch)
    if (!conversation) {
      throw new NotFoundException('Диалог не найден')
    }
    this.logger.log(
      `Диалог id=${id} изменён operatorId=${operator.id}: ${JSON.stringify({ status: dto.status, assigneeId: dto.assigneeId, tags: dto.tags?.length })}`,
    )
    this.events.emit({ type: 'conversation.updated', conversation })

    const statusText = dto.status && STATUS_SYSTEM_TEXT[dto.status]
    if (statusText) {
      conversation = await this.messaging.postSystem(conversation, statusText)
    }
    if (assignee) {
      // Без имени: клиенту важно, что ответит человек, а не кто именно
      conversation = await this.messaging.postSystem(conversation, 'К диалогу подключился оператор')
    }
    return this.mapper.conversation(conversation, 'operator')
  }

  public async deleteConversation(operator: SupportOperator, id: number): Promise<SupportConversationDto> {
    const deleted = await this.store.deleteConversation(id, this.scope())
    if (!deleted) {
      throw new NotFoundException('Диалог не найден')
    }
    deleted.attachmentPaths.forEach(path => this.files.remove(path))
    this.logger.log(
      `Диалог id=${id} удалён operatorId=${operator.id}, файлов удалено ${deleted.attachmentPaths.length}`,
    )
    this.events.emit({ type: 'conversation.deleted', conversation: deleted.conversation })
    return this.mapper.conversation(deleted.conversation, 'operator')
  }

  public assign(operator: SupportOperator, id: number) {
    return this.updateConversation(operator, id, { assigneeId: operator.id })
  }

  public close(operator: SupportOperator, id: number) {
    return this.updateConversation(operator, id, { status: 'CLOSED' })
  }

  public reopen(operator: SupportOperator, id: number) {
    return this.updateConversation(operator, id, { status: 'OPEN' })
  }

  public async markRead(operator: SupportOperator, dto: MarkSupportReadDto): Promise<SupportConversationDto> {
    const conversation = await this.store.markRead(dto.conversationId, this.scope(), 'OPERATOR', dto.seq)
    if (!conversation) {
      throw new NotFoundException('Диалог не найден')
    }
    this.logger.debug(
      `Прочитано operatorId=${operator.id} conversationId=${conversation.id} до seq=${conversation.operatorReadSeq}`,
    )
    this.events.emit({ type: 'conversation.read', conversation, side: 'OPERATOR', seq: conversation.operatorReadSeq })
    return this.mapper.conversation(conversation, 'operator')
  }

  // ── Сообщения ──────────────────────────────────────────────────────────────

  public history(query: ListSupportMessagesQueryDto) {
    return this.messaging.history({ ...query, scope: this.scope(), includeInternal: true })
  }

  public async getMessage(id: number): Promise<SupportMessageDto> {
    const message = await this.store.findMessage(id, { ...this.scope(), includeInternal: true })
    if (!message) {
      throw new NotFoundException('Сообщение не найдено')
    }
    return this.mapper.message(message)
  }

  /**
   * Публичный ответ: диалог ждёт клиента, а без исполнителя — достаётся ответившему. Заметка статус не трогает.
   * channel — откуда ответил оператор: мосты в мессенджеры по нему не зеркалят сообщение обратно.
   */
  public async createMessage(
    operator: SupportOperator,
    dto: CreateSupportOperatorMessageDto,
    files: Express.Multer.File[],
    channel: SupportChannel = 'WIDGET',
  ): Promise<SupportMessageDto> {
    const isInternalNote = dto.isInternalNote ?? false
    const result = await this.messaging.post({
      conversationId: dto.conversationId,
      scope: this.scope(),
      input: this.operatorInput(operator, {
        text: dto.text ?? '',
        isInternalNote,
        clientMessageId: dto.clientMessageId ?? null,
        replyToId: dto.replyToId ?? null,
        channel,
      }),
      effects: isInternalNote
        ? { readBy: 'OPERATOR' }
        : {
            readBy: 'OPERATOR',
            unreadFor: 'CONTACT',
            status: 'PENDING',
            assignIfUnassigned: { id: operator.id, name: operator.name },
          },
      files,
      // Заметку клиент не увидит — и кнопки ему слать незачем
      actions: isInternalNote ? undefined : dto.actions,
    })
    return this.mapper.message(result.message)
  }

  public async updateMessage(
    operator: SupportOperator,
    id: number,
    dto: UpdateSupportMessageDto,
  ): Promise<SupportMessageDto> {
    const message = await this.store.updateMessageText(id, this.ownMessageScope(operator), dto.text)
    if (!message) {
      throw new NotFoundException('Сообщение не найдено или оно не ваше')
    }
    this.logger.log(`Оператор operatorId=${operator.id} изменил сообщение id=${id}`)
    this.events.emit({ type: 'message.updated', contactId: message.contactId, message })
    return this.mapper.message(message)
  }

  /** Удалить можно любое сообщение диалога — в том числе спам клиента. */
  public async deleteMessage(operator: SupportOperator, id: number): Promise<SupportMessageDto> {
    const message = await this.store.softDeleteMessage(id, { ...this.scope(), includeInternal: true })
    if (!message) {
      throw new NotFoundException('Сообщение не найдено')
    }
    this.logger.log(`Оператор operatorId=${operator.id} удалил сообщение id=${id}`)
    this.events.emit({ type: 'message.deleted', contactId: message.contactId, message })
    return this.mapper.message(message)
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private scope() {
    return { workspaceKey: this.options.workspaceKey }
  }

  private ownMessageScope(operator: SupportOperator): SupportMessageScope {
    return { ...this.scope(), author: 'OPERATOR', authorId: operator.id, includeInternal: true }
  }

  private operatorInput(
    operator: SupportOperator,
    message: {
      text: string
      isInternalNote?: boolean
      clientMessageId?: string | null
      replyToId?: number | null
      channel?: SupportChannel
    },
  ) {
    return {
      author: 'OPERATOR' as const,
      authorId: operator.id,
      authorName: operator.name,
      text: message.text,
      isInternalNote: message.isInternalNote ?? false,
      clientMessageId: message.clientMessageId ?? null,
      replyToId: message.replyToId ?? null,
      channel: message.channel ?? 'WIDGET',
    }
  }
}
