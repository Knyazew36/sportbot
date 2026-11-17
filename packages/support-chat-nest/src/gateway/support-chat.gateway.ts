import {
  SUPPORT_LIMITS,
  SUPPORT_SOCKET_NAMESPACE,
  type SupportClientToServerEvents,
  type SupportServerToClientEvents,
  type SupportSocketAuth,
} from '@app/support-chat-core'
import { Inject, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Subscription } from 'rxjs'
import type { Namespace, Socket } from 'socket.io'

import { SupportIdentity, type SupportOperator, SupportStore } from '../ports'
import { SupportChatMapper } from '../services/support-chat.mapper'
import { type SupportEvent, SupportEvents } from '../services/support-events'
import { VisitTokenService } from '../services/visit-token.service'
import { SUPPORT_CHAT_OPTIONS, SUPPORT_LOG_EMOJI } from '../support-chat.constants'
import type { SupportChatResolvedOptions } from '../support-chat.options'

const OPERATORS_ROOM = 'operators'
const contactRoom = (contactId: number) => `contact:${contactId}`

type SocketData =
  | { kind: 'contact'; contactId: number; lastTypingAt: number; conversations: Set<number> }
  | { kind: 'operator'; operator: SupportOperator; lastTypingAt: number }

type SupportSocket = Socket<SupportClientToServerEvents, SupportServerToClientEvents, Record<string, never>, SocketData>
type SupportNamespace = Namespace<
  SupportClientToServerEvents,
  SupportServerToClientEvents,
  Record<string, never>,
  SocketData
>

/**
 * Реалтайм чата. Только доставка: сокет — подсказка «что-то изменилось», всё сохраняемое идёт через REST,
 * а пропущенное при обрыве клиент добирает по seq. От клиента принимается только эфемерное «печатает…».
 *
 * Комнаты: contact:<id> — все вкладки посетителя, operators — все операторы workspace.
 * Только транспорт websocket: без long-polling не нужны sticky-сессии при нескольких инстансах.
 */
// Глобальный ThrottlerGuard проекта в контексте сокета падает (нет req.ip) — частоту «печатает…» режем сами
@SkipThrottle()
@WebSocketGateway({ namespace: SUPPORT_SOCKET_NAMESPACE, transports: ['websocket'], cors: { origin: true } })
export class SupportChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  private readonly server: SupportNamespace

  private readonly logger = new Logger(`${SUPPORT_LOG_EMOJI} ${SupportChatGateway.name}`)
  private subscription?: Subscription
  /** contactId диалога — чтобы «печатает…» оператора не ходило в БД на каждое нажатие. */
  private readonly conversationContacts = new Map<number, number>()

  constructor(
    @Inject(SUPPORT_CHAT_OPTIONS) private readonly options: SupportChatResolvedOptions,
    private readonly tokens: VisitTokenService,
    private readonly identity: SupportIdentity,
    private readonly store: SupportStore,
    private readonly events: SupportEvents,
    private readonly mapper: SupportChatMapper,
  ) {}

  // ── Жизненный цикл ─────────────────────────────────────────────────────────

  public onModuleInit(): void {
    this.subscription = this.events.stream.subscribe(event => {
      try {
        this.broadcast(event)
      } catch (error) {
        this.logger.error(`Не удалось разослать событие ${event.type}`, error instanceof Error ? error.stack : error)
      }
    })
  }

  public onModuleDestroy(): void {
    this.subscription?.unsubscribe()
  }

  public async handleConnection(socket: SupportSocket): Promise<void> {
    const origin = socket.handshake.headers.origin
    if (origin && this.options.allowedOrigins && !this.options.allowedOrigins(origin)) {
      this.logger.warn(`Подключение с чужого origin отклонено: ${origin}`)
      socket.disconnect(true)
      return
    }

    const auth = (socket.handshake.auth ?? {}) as SupportSocketAuth
    const contactId = this.tokens.verify(auth.visitToken)
    if (contactId !== null) {
      socket.data = { kind: 'contact', contactId, lastTypingAt: 0, conversations: new Set() }
      await socket.join(contactRoom(contactId))
      socket.emit('presence', { operatorsOnline: await this.operatorsOnline() })
      this.logger.debug(`Посетитель подключился contactId=${contactId} socket=${socket.id}`)
      return
    }

    const authorization = auth.authorization ?? socket.handshake.headers.authorization
    const operator = authorization
      ? await this.identity.resolveOperator({ headers: { ...socket.handshake.headers, authorization } })
      : null
    if (operator) {
      socket.data = { kind: 'operator', operator, lastTypingAt: 0 }
      await socket.join(OPERATORS_ROOM)
      this.logger.log(`Оператор подключился operatorId=${operator.id} socket=${socket.id}`)
      await this.broadcastPresence()
      return
    }

    this.logger.debug(`Подключение без валидной авторизации отклонено socket=${socket.id}`)
    socket.disconnect(true)
  }

  public async handleDisconnect(socket: SupportSocket): Promise<void> {
    if (socket.data?.kind === 'operator') {
      this.logger.log(`Оператор отключился operatorId=${socket.data.operator.id} socket=${socket.id}`)
      await this.broadcastPresence()
    }
  }

  // ── Сообщения клиента ──────────────────────────────────────────────────────

  @SubscribeMessage('typing')
  public async handleTyping(
    @ConnectedSocket() socket: SupportSocket,
    @MessageBody() payload: { conversationId?: unknown; internal?: unknown },
  ): Promise<void> {
    const data = socket.data
    const conversationId = Number(payload?.conversationId)
    // data пустой, пока handleConnection не закончил авторизацию
    if (!data?.kind || !Number.isInteger(conversationId) || conversationId <= 0) return

    // Лишние события просто отбрасываем: «печатает…» не стоит ответа с ошибкой
    const now = Date.now()
    if (now - data.lastTypingAt < SUPPORT_LIMITS.typingThrottleMs) return
    data.lastTypingAt = now

    if (data.kind === 'contact') {
      if (!(await this.ownsConversation(data, conversationId))) return
      this.server.to(OPERATORS_ROOM).emit('typing', { conversationId, side: 'CONTACT', name: null })
      return
    }

    const typing = { conversationId, side: 'OPERATOR' as const, name: data.operator.name }
    socket.to(OPERATORS_ROOM).emit('typing', typing)
    // Заметку клиент не видит — значит, и то, что её пишут, тоже
    if (payload.internal === true) return

    const contactId = await this.contactOf(conversationId)
    if (contactId !== null) this.server.to(contactRoom(contactId)).emit('typing', typing)
  }

  // ── Присутствие ────────────────────────────────────────────────────────────

  /** Есть ли у посетителя открытая вкладка — с учётом других инстансов, если подключён адаптер. */
  public async isContactOnline(contactId: number): Promise<boolean> {
    const sockets = await this.server.in(contactRoom(contactId)).fetchSockets()
    return sockets.length > 0
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private broadcast(event: SupportEvent): void {
    switch (event.type) {
      case 'message.created': {
        this.conversationContacts.set(event.conversation.id, event.conversation.contactId)
        this.emitMessage(event.type, event.conversation.contactId, event.message)
        return
      }
      case 'message.updated':
      case 'message.deleted': {
        this.emitMessage(event.type, event.contactId, event.message)
        return
      }
      case 'conversation.updated': {
        const { conversation } = event
        this.server
          .to(OPERATORS_ROOM)
          .emit(event.type, { conversation: this.mapper.conversation(conversation, 'operator') })
        this.server
          .to(contactRoom(conversation.contactId))
          .emit(event.type, { conversation: this.mapper.conversation(conversation, 'contact') })
        return
      }
      case 'conversation.deleted': {
        const { conversation } = event
        this.conversationContacts.delete(conversation.id)
        this.server
          .to([OPERATORS_ROOM, contactRoom(conversation.contactId)])
          .emit(event.type, { conversationId: conversation.id })
        return
      }
      case 'conversation.read': {
        const { conversation, side, seq } = event
        this.server
          .to([OPERATORS_ROOM, contactRoom(conversation.contactId)])
          .emit(event.type, { conversationId: conversation.id, side, seq })
        return
      }
    }
  }

  private emitMessage(
    type: 'message.created' | 'message.updated' | 'message.deleted',
    contactId: number,
    record: Parameters<SupportChatMapper['message']>[0],
  ): void {
    const message = this.mapper.message(record)
    // Заметки операторов посетителю не уходят никогда
    const rooms = record.isInternalNote ? [OPERATORS_ROOM] : [OPERATORS_ROOM, contactRoom(contactId)]
    this.server.to(rooms).emit(type, { message })
  }

  private async ownsConversation(
    data: Extract<SocketData, { kind: 'contact' }>,
    conversationId: number,
  ): Promise<boolean> {
    if (data.conversations.has(conversationId)) return true
    const conversation = await this.store.findConversation(conversationId, {
      workspaceKey: this.options.workspaceKey,
      contactId: data.contactId,
    })
    if (!conversation) return false
    data.conversations.add(conversationId)
    return true
  }

  private async contactOf(conversationId: number): Promise<number | null> {
    const cached = this.conversationContacts.get(conversationId)
    if (cached !== undefined) return cached
    const conversation = await this.store.findConversation(conversationId, { workspaceKey: this.options.workspaceKey })
    if (!conversation) return null
    this.conversationContacts.set(conversationId, conversation.contactId)
    return conversation.contactId
  }

  private async operatorsOnline(): Promise<number> {
    const sockets = await this.server.in(OPERATORS_ROOM).fetchSockets()
    // У одного оператора может быть несколько вкладок
    return new Set(sockets.map(socket => (socket.data.kind === 'operator' ? socket.data.operator.id : socket.id))).size
  }

  private async broadcastPresence(): Promise<void> {
    try {
      this.server.emit('presence', { operatorsOnline: await this.operatorsOnline() })
    } catch (error) {
      this.logger.error('Не удалось разослать присутствие операторов', error instanceof Error ? error.stack : error)
    }
  }
}
