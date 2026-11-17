import {
  SUPPORT_LIMITS,
  SUPPORT_VISIT_HEADER,
  type SupportContact,
  type SupportConversation,
  type SupportCursorPage,
  type SupportMessage,
  type SupportSession,
} from '@app/support-chat-core'

import { SupportApiError, SupportHttp } from './http'
import { createSupportSocket, socketUrlFromApi, type SupportSocket, watchWake } from './socket'
import { StateStore } from './state-store'
import { browserStorage, type SupportStorage } from './storage'
import { SupportTimeline, toSupportReply } from './timeline'

/** Пользователь внешнего сайта, подписанный на его бэкенде (userHash = HMAC-SHA256(secret, userId)). */
export interface SupportVisitorIdentity {
  userId: string
  userHash: string
}

export interface SupportVisitorProfile {
  name?: string
  email?: string
  phone?: string
}

export interface SupportVisitorClientOptions {
  /** Адрес API с префиксом: https://api.example.com/api */
  baseUrl: string
  /** Адрес сокета; по умолчанию origin из baseUrl. */
  socketUrl?: string
  socketPath?: string
  storage?: SupportStorage
  /** Префикс ключей хранилища — если на одном домене несколько чатов. */
  storageKey?: string
  /** Заголовок Authorization проекта: залогиненный пользователь попадёт в чат под своим аккаунтом. */
  getAuthorization?: () => string | null
  identity?: SupportVisitorIdentity
  profile?: SupportVisitorProfile
}

export type SupportVisitorStatus = 'idle' | 'starting' | 'ready' | 'error'

export interface SupportVisitorState {
  status: SupportVisitorStatus
  error: string | null
  connected: boolean
  contact: SupportContact | null
  conversation: SupportConversation | null
  operatorsOnline: number
  /** Оператор печатает: имя или пустая строка, null — никто. */
  operatorTyping: string | null
  /** Непрочитанные ответы поддержки. */
  unread: number
}

const VISIBLE_AUTHORS = new Set<SupportMessage['author']>(['OPERATOR', 'BOT'])

/**
 * SDK посетителя: вход в чат, текущий диалог, лента, реалтайм. Без фреймворка — UI подписывается
 * на store и timeline.store.
 */
export class SupportVisitorClient {
  public readonly store = new StateStore<SupportVisitorState>({
    status: 'idle',
    error: null,
    connected: false,
    contact: null,
    conversation: null,
    operatorsOnline: 0,
    operatorTyping: null,
    unread: 0,
  })

  public readonly timeline: SupportTimeline

  private readonly http: SupportHttp
  private readonly storage: SupportStorage
  private readonly keys: { anonymous: string; outbox: string }
  private socket: SupportSocket | null = null
  private token: string | null = null
  private starting: Promise<void> | null = null
  private typingSentAt = 0
  private typingTimer: ReturnType<typeof setTimeout> | null = null
  private detachWake: () => void = () => undefined
  private readonly cleanups: Array<() => void> = []

  constructor(private readonly options: SupportVisitorClientOptions) {
    this.storage = options.storage ?? browserStorage
    const prefix = options.storageKey ?? 'support-chat'
    this.keys = { anonymous: `${prefix}:anonymous-key`, outbox: `${prefix}:outbox` }

    this.http = new SupportHttp({
      baseUrl: options.baseUrl,
      headers: (): Record<string, string> => (this.token ? { [SUPPORT_VISIT_HEADER]: this.token } : {}),
    })

    this.timeline = new SupportTimeline({
      author: 'CONTACT',
      persist: { storage: this.storage, key: this.keys.outbox },
      api: {
        list: params =>
          this.withSession(() => this.http.get<SupportCursorPage<SupportMessage>>('/support/message/list', params)),
        create: form => this.withSession(() => this.http.post<SupportMessage>('/support/message/create', form)),
      },
      onForeignConversation: () => this.refreshConversation(),
    })
    this.cleanups.push(this.timeline.store.subscribe(() => this.recountUnread()))
  }

  // ── Жизненный цикл ─────────────────────────────────────────────────────────

  /** Войти в чат и подключиться. Повторный вызов ждёт уже идущий вход. */
  public start(): Promise<void> {
    if (this.store.getState().status === 'ready') return Promise.resolve()
    this.starting ??= this.runStart().finally(() => (this.starting = null))
    return this.starting
  }

  /** Пользователь вошёл или вышел: заново определить, кто пишет. */
  public async restart(): Promise<void> {
    this.stop()
    await this.timeline.setConversation(null)
    this.store.setState({ contact: null, conversation: null, unread: 0 })
    await this.start()
  }

  public stop(): void {
    this.timeline.pause()
    this.detachWake()
    this.socket?.disconnect()
    this.socket = null
    this.token = null
    this.store.setState({ status: 'idle', connected: false })
  }

  public destroy(): void {
    this.stop()
    this.timeline.destroy()
    this.cleanups.splice(0).forEach(cleanup => cleanup())
  }

  // ── Действия ───────────────────────────────────────────────────────────────

  /** replyTo — сообщение ленты, на которое отвечаем. */
  public send(text: string, files: File[] = [], options: { replyTo?: SupportMessage | null } = {}): void {
    if (!text.trim() && files.length === 0) return
    this.timeline.send(
      text,
      files.slice(0, SUPPORT_LIMITS.attachmentsMax),
      {},
      options.replyTo ? toSupportReply(options.replyTo) : null,
    )
    void this.start()
  }

  public retry(key: string): void {
    this.timeline.retry(key)
  }

  public discard(key: string): void {
    this.timeline.discard(key)
  }

  public loadOlder(): Promise<void> {
    return this.timeline.loadOlder()
  }

  /** Окно чата видно — всё, что в ленте, прочитано. */
  public async markRead(): Promise<void> {
    const conversation = this.store.getState().conversation
    const seq = this.timeline.lastSeq
    if (!conversation || seq <= conversation.contactReadSeq) return
    // Сразу гасим счётчик, ответ сервера придёт следом
    this.store.setState({ conversation: { ...conversation, contactReadSeq: seq } })
    this.recountUnread()
    try {
      const updated = await this.withSession(() =>
        this.http.post<SupportConversation>('/support/conversation/read', { conversationId: conversation.id, seq }),
      )
      this.setConversation(updated)
    } catch {
      // Не критично: при следующем открытии отметим снова
    }
  }

  public async rate(rating: number): Promise<void> {
    const conversation = this.store.getState().conversation
    if (!conversation) return
    const updated = await this.withSession(() =>
      this.http.post<SupportConversation>('/support/conversation/rate', { conversationId: conversation.id, rating }),
    )
    this.setConversation(updated)
  }

  /** Вызывать на ввод текста — сам ограничит частоту. */
  public notifyTyping(): void {
    const conversation = this.store.getState().conversation
    const now = Date.now()
    if (!conversation || !this.socket?.connected || now - this.typingSentAt < SUPPORT_LIMITS.typingThrottleMs) return
    this.typingSentAt = now
    this.socket.emit('typing', { conversationId: conversation.id })
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private async runStart(): Promise<void> {
    this.store.setState({ status: 'starting', error: null })
    try {
      await this.openSession()
      const { conversation } = await this.http.get<{ conversation: SupportConversation | null }>(
        '/support/conversation/current',
      )
      this.setConversation(conversation)
      await this.timeline.setConversation(conversation?.id ?? null)
      this.connectSocket()
      this.timeline.resume()
      this.store.setState({ status: 'ready' })
    } catch (error) {
      this.store.setState({ status: 'error', error: error instanceof Error ? error.message : 'Чат недоступен' })
    }
  }

  private async openSession(): Promise<void> {
    // Авторизация проекта нужна только здесь: по ней сервер узнаёт пользователя. Дальше — токен визита
    const authorization = this.options.getAuthorization?.()
    const session = await this.http.post<SupportSession>(
      '/support/session',
      {
        anonymousKey: this.storage.get(this.keys.anonymous) ?? undefined,
        ...this.options.identity,
        ...this.options.profile,
      },
      authorization ? { Authorization: authorization } : undefined,
    )
    this.token = session.token
    if (session.anonymousKey) this.storage.set(this.keys.anonymous, session.anonymousKey)
    else this.storage.remove(this.keys.anonymous)
    this.store.setState({ contact: session.contact })
  }

  /** Токен визита истёк — один раз открываем сессию заново и повторяем запрос. */
  private async withSession<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (!(error instanceof SupportApiError) || error.status !== 401) throw error
      await this.openSession()
      return request()
    }
  }

  private connectSocket(): void {
    this.socket?.disconnect()
    const socket = createSupportSocket({
      url: this.options.socketUrl ?? socketUrlFromApi(this.options.baseUrl),
      path: this.options.socketPath,
      auth: () => ({ visitToken: this.token ?? undefined }),
    })
    this.socket = socket

    socket.on('connect', () => {
      this.store.setState({ connected: true })
      // Пока сокета не было, события могли потеряться
      void this.timeline.sync()
      void this.refreshConversation()
    })
    socket.on('disconnect', () => this.store.setState({ connected: false, operatorTyping: null }))
    socket.on('message.created', ({ message }) => this.timeline.apply(message))
    socket.on('message.updated', ({ message }) => this.timeline.apply(message))
    socket.on('message.deleted', ({ message }) => this.timeline.apply(message))
    socket.on('conversation.updated', ({ conversation }) => {
      const current = this.store.getState().conversation
      if (!current || current.id === conversation.id || conversation.id > current.id) {
        this.setConversation(conversation)
        void this.timeline.setConversation(conversation.id)
      }
    })
    socket.on('conversation.deleted', ({ conversationId }) => {
      if (this.store.getState().conversation?.id !== conversationId) return
      this.setConversation(null)
      void this.timeline.setConversation(null)
    })
    socket.on('conversation.read', ({ conversationId, side, seq }) => {
      const current = this.store.getState().conversation
      if (side !== 'OPERATOR' || current?.id !== conversationId) return
      this.setConversation({ ...current, operatorReadSeq: Math.max(current.operatorReadSeq, seq) })
    })
    socket.on('typing', ({ conversationId, side, name }) => {
      if (side !== 'OPERATOR' || this.store.getState().conversation?.id !== conversationId) return
      this.store.setState({ operatorTyping: name ?? '' })
      if (this.typingTimer) clearTimeout(this.typingTimer)
      this.typingTimer = setTimeout(() => this.store.setState({ operatorTyping: null }), SUPPORT_LIMITS.typingTimeoutMs)
    })
    socket.on('presence', ({ operatorsOnline }) => this.store.setState({ operatorsOnline }))
    socket.on('connect_error', () => this.store.setState({ connected: false }))

    this.detachWake = watchWake(() => {
      this.timeline.flush()
      if (!socket.connected) socket.connect()
    })
    socket.connect()
  }

  private async refreshConversation(): Promise<void> {
    try {
      const { conversation } = await this.withSession(() =>
        this.http.get<{ conversation: SupportConversation | null }>('/support/conversation/current'),
      )
      this.setConversation(conversation)
      await this.timeline.setConversation(conversation?.id ?? null)
    } catch {
      // Следующее событие или переподключение попробуют снова
    }
  }

  private setConversation(conversation: SupportConversation | null): void {
    this.store.setState({ conversation })
    this.recountUnread()
  }

  private recountUnread(): void {
    const readSeq = this.store.getState().conversation?.contactReadSeq ?? 0
    const unread = this.timeline.store
      .getState()
      .messages.filter(
        message =>
          message.localStatus === 'sent' &&
          VISIBLE_AUTHORS.has(message.author) &&
          message.seq > readSeq &&
          !message.deletedAt,
      ).length
    if (unread !== this.store.getState().unread) this.store.setState({ unread })
  }
}
