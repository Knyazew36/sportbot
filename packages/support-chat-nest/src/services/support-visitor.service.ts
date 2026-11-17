import { SUPPORT_LIMITS, type SupportChannel } from '@app/support-chat-core'
import { Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'crypto'

import type {
  CreateSupportMessageDto,
  CreateSupportSessionDto,
  ListSupportMessagesQueryDto,
  MarkSupportReadDto,
  RateSupportConversationDto,
  SupportConversationDto,
  SupportCurrentConversationDto,
  SupportMessageDto,
  SupportSessionDto,
  UpdateSupportMessageDto,
} from '../dto'
import { SupportIdentity, type SupportRequestLike, SupportStore } from '../ports'
import { SUPPORT_CHAT_OPTIONS, SUPPORT_LOG_EMOJI } from '../support-chat.constants'
import type { SupportChatResolvedOptions } from '../support-chat.options'
import type { SupportContactPatch, SupportContactRecord, SupportMessageScope } from '../support-chat.records'

import { SupportChatMapper } from './support-chat.mapper'
import { SupportEvents } from './support-events'
import { SupportMessagingService } from './support-messaging.service'
import { VisitTokenService } from './visit-token.service'

/** Сторона посетителя: вход в чат, свой диалог, свои сообщения. */
@Injectable()
export class SupportVisitorService {
  private readonly logger = new Logger(`${SUPPORT_LOG_EMOJI} ${SupportVisitorService.name}`)

  constructor(
    @Inject(SUPPORT_CHAT_OPTIONS) private readonly options: SupportChatResolvedOptions,
    private readonly store: SupportStore,
    private readonly identity: SupportIdentity,
    private readonly tokens: VisitTokenService,
    private readonly messaging: SupportMessagingService,
    private readonly events: SupportEvents,
    private readonly mapper: SupportChatMapper,
  ) {}

  // ── Сессия ─────────────────────────────────────────────────────────────────

  /**
   * Кто пишет, по убыванию надёжности: пользователь проекта из запроса → подписанный пользователь
   * внешнего сайта → аноним по ключу из прошлого визита → новый аноним. Если аноним вошёл в аккаунт,
   * его диалоги переносятся в контакт пользователя.
   */
  public async startSession(dto: CreateSupportSessionDto, request: SupportRequestLike): Promise<SupportSessionDto> {
    const workspaceKey = this.options.workspaceKey
    const patch: SupportContactPatch = { name: dto.name, email: dto.email, phone: dto.phone }

    const identified = await this.identifiedContact(dto, request, patch)
    let contact: SupportContactRecord
    let anonymous = false

    if (identified) {
      contact = identified
      const previous = dto.anonymousKey && (await this.store.findContactByAnonymousKey(workspaceKey, dto.anonymousKey))
      if (previous && previous.id !== contact.id) {
        await this.store.mergeContacts(previous.id, contact.id)
        this.logger.log(`Анонимный контакт id=${previous.id} объединён с контактом id=${contact.id}`)
      }
    } else {
      const existing = dto.anonymousKey && (await this.store.findContactByAnonymousKey(workspaceKey, dto.anonymousKey))
      if (existing) {
        contact = this.hasPatch(patch)
          ? ((await this.store.updateContact(existing.id, workspaceKey, patch)) ?? existing)
          : existing
      } else {
        contact = await this.store.createContact({ workspaceKey, anonymousKey: randomUUID(), ...patch })
        this.logger.log(`Новый анонимный контакт id=${contact.id}`)
      }
      anonymous = true
    }

    const { token, expiresAt } = this.tokens.sign(contact.id)
    this.logger.debug(`Сессия чата contactId=${contact.id} аноним=${anonymous}`)
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      anonymousKey: anonymous ? contact.anonymousKey : null,
      contact: this.mapper.contact(contact),
    }
  }

  // ── Диалог ─────────────────────────────────────────────────────────────────

  public async currentConversation(contactId: number): Promise<SupportCurrentConversationDto> {
    const conversation = await this.store.findActiveConversation(contactId, this.options.workspaceKey)
    return { conversation: conversation ? this.mapper.conversation(conversation, 'contact') : null }
  }

  public async markRead(contactId: number, dto: MarkSupportReadDto): Promise<SupportConversationDto> {
    const conversation = await this.store.markRead(dto.conversationId, this.scope(contactId), 'CONTACT', dto.seq)
    if (!conversation) {
      throw new NotFoundException('Диалог не найден')
    }
    this.events.emit({ type: 'conversation.read', conversation, side: 'CONTACT', seq: conversation.contactReadSeq })
    return this.mapper.conversation(conversation, 'contact')
  }

  public async rate(contactId: number, dto: RateSupportConversationDto): Promise<SupportConversationDto> {
    const conversation = await this.store.updateConversation(dto.conversationId, this.scope(contactId), {
      rating: dto.rating,
    })
    if (!conversation) {
      throw new NotFoundException('Диалог не найден')
    }
    this.logger.log(`Оценка conversationId=${conversation.id} contactId=${contactId}: ${dto.rating}`)
    this.events.emit({ type: 'conversation.updated', conversation })
    return this.mapper.conversation(conversation, 'contact')
  }

  // ── Сообщения ──────────────────────────────────────────────────────────────

  public history(contactId: number, query: ListSupportMessagesQueryDto) {
    return this.messaging.history({ ...query, scope: this.scope(contactId), includeInternal: false })
  }

  /**
   * Пишет в текущий незакрытый диалог; его нет — открывает новый. Решённый или ждущий ответа — снова OPEN.
   * channel — откуда пишет клиент: проект может принимать сообщения не только из виджета, но и из своих ботов.
   */
  public async createMessage(
    contactId: number,
    dto: CreateSupportMessageDto,
    files: Express.Multer.File[],
    channel: SupportChannel = 'WIDGET',
  ): Promise<SupportMessageDto> {
    const workspaceKey = this.options.workspaceKey
    const conversation =
      (await this.store.findActiveConversation(contactId, workspaceKey)) ??
      (await this.store.createConversation({ workspaceKey, contactId, sourceChannel: channel }))
    if (!conversation) {
      // Контакт удалили (например, объединили), а токен ещё живой
      throw new UnauthorizedException('Сессия чата устарела, откройте чат заново')
    }

    const result = await this.messaging.post({
      conversationId: conversation.id,
      scope: this.scope(contactId),
      input: {
        author: 'CONTACT',
        authorId: contactId,
        authorName: null,
        text: dto.text ?? '',
        isInternalNote: false,
        clientMessageId: dto.clientMessageId ?? null,
        replyToId: dto.replyToId ?? null,
        channel,
      },
      effects: {
        readBy: 'CONTACT',
        unreadFor: 'OPERATOR',
        ...(conversation.status === 'OPEN' ? {} : { status: 'OPEN' as const }),
      },
      files,
    })
    return this.mapper.message(result.message)
  }

  public async updateMessage(contactId: number, id: number, dto: UpdateSupportMessageDto): Promise<SupportMessageDto> {
    const message = await this.store.updateMessageText(id, this.ownMessageScope(contactId), dto.text)
    if (!message) {
      throw new NotFoundException('Сообщение не найдено или его уже нельзя изменить')
    }
    this.logger.log(`Посетитель изменил сообщение id=${id} contactId=${contactId}`)
    this.events.emit({ type: 'message.updated', contactId, message })
    return this.mapper.message(message)
  }

  public async deleteMessage(contactId: number, id: number): Promise<SupportMessageDto> {
    const message = await this.store.softDeleteMessage(id, this.ownMessageScope(contactId))
    if (!message) {
      throw new NotFoundException('Сообщение не найдено или его уже нельзя удалить')
    }
    this.logger.log(`Посетитель удалил сообщение id=${id} contactId=${contactId}`)
    this.events.emit({ type: 'message.deleted', contactId, message })
    return this.mapper.message(message)
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private async identifiedContact(
    dto: CreateSupportSessionDto,
    request: SupportRequestLike,
    patch: SupportContactPatch,
  ): Promise<SupportContactRecord | null> {
    const workspaceKey = this.options.workspaceKey

    const user = await this.identity.resolveUser(request)
    if (user) {
      return this.store.upsertContactByExternalUserId(workspaceKey, user.externalUserId, {
        name: user.name ?? patch.name,
        email: user.email ?? patch.email,
        phone: user.phone ?? patch.phone,
      })
    }

    if (dto.userId || dto.userHash) {
      if (!dto.userId || !dto.userHash || !this.tokens.verifyUserHash(dto.userId, dto.userHash)) {
        this.logger.warn(`Подпись пользователя внешнего сайта не сошлась userId=${dto.userId ?? '-'}`)
        throw new UnauthorizedException('Не удалось подтвердить пользователя')
      }
      return this.store.upsertContactByExternalUserId(workspaceKey, dto.userId, patch)
    }

    return null
  }

  private hasPatch(patch: SupportContactPatch): boolean {
    return Object.values(patch).some(value => value !== undefined)
  }

  private scope(contactId: number) {
    return { workspaceKey: this.options.workspaceKey, contactId }
  }

  private ownMessageScope(contactId: number): SupportMessageScope {
    return {
      ...this.scope(contactId),
      author: 'CONTACT',
      authorId: contactId,
      createdAfter: new Date(Date.now() - SUPPORT_LIMITS.messageEditWindowMs),
      includeInternal: false,
    }
  }
}
