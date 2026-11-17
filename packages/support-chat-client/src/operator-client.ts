import {
  SUPPORT_LIMITS,
  type SupportChannel,
  type SupportConversation,
  type SupportConversationStatus,
  type SupportCursorPage,
  type SupportMessage,
} from '@app/support-chat-core'

import { SupportHttp } from './http'
import { createSupportSocket, socketUrlFromApi, type SupportSocket, watchWake } from './socket'
import { StateStore } from './state-store'
import { SupportTimeline, toSupportReply } from './timeline'

export interface SupportOperatorClientOptions {
  /** Адрес API с префиксом: https://api.example.com/api */
  baseUrl: string
  socketUrl?: string
  socketPath?: string
  /** Заголовок Authorization проекта (Bearer …): операторов проверяет сервер проекта. */
  getAuthorization: () => string | null
}

export interface SupportInboxFilters {
  /** Пусто — все статусы. */
  status: SupportConversationStatus[]
  assignee: 'all' | 'me' | 'none'
  channel: SupportChannel | null
  search: string
  page: number
  limit: number
}

export interface SupportInboxState {
  items: SupportConversation[]
  total: number
  totalPages: number
  loading: boolean
  error: string | null
}

export interface SupportOperatorState {
  connected: boolean
  operatorsOnline: number
  filters: SupportInboxFilters
  inbox: SupportInboxState
  /** Клиент печатает: id диалога → время, до которого показывать. */
  typing: Record<number, number>
}

export interface SupportConversationPatch {
  status?: SupportConversationStatus
  assigneeId?: number | null
  tags?: string[]
}

interface PageResponse {
  items: SupportConversation[]
  meta: { total: number; totalPages: number }
}

const RELOAD_DEBOUNCE_MS = 400

/**
 * SDK оператора: инбокс с живыми обновлениями и открытые диалоги (openConversation).
 * Источник правды — сервер; сокет только подсказывает, что обновить.
 */
export class SupportOperatorClient {
  public readonly store = new StateStore<SupportOperatorState>({
    connected: false,
    operatorsOnline: 0,
    filters: { status: ['OPEN', 'PENDING'], assignee: 'all', channel: null, search: '', page: 1, limit: 25 },
    inbox: { items: [], total: 0, totalPages: 1, loading: false, error: null },
    typing: {},
  })

  /** @internal — для SupportOperatorConversation */
  public readonly http: SupportHttp

  private socket: SupportSocket | null = null
  private readonly conversations = new Set<SupportOperatorConversation>()
  private reloadTimer: ReturnType<typeof setTimeout> | null = null
  private reloadRequest = 0
  private detachWake: () => void = () => undefined

  constructor(private readonly options: SupportOperatorClientOptions) {
    this.http = new SupportHttp({
      baseUrl: options.baseUrl,
      headers: (): Record<string, string> => {
        const authorization = options.getAuthorization()
        return authorization ? { Authorization: authorization } : {}
      },
    })
  }

  // ── Жизненный цикл ─────────────────────────────────────────────────────────

  public connect(): void {
    if (this.socket) return
    const socket = createSupportSocket({
      url: this.options.socketUrl ?? socketUrlFromApi(this.options.baseUrl),
      path: this.options.socketPath,
      auth: () => ({ authorization: this.options.getAuthorization() ?? undefined }),
    })
    this.socket = socket

    socket.on('connect', () => {
      this.store.setState({ connected: true })
      void this.reloadInbox()
      this.conversations.forEach(conversation => void conversation.sync())
    })
    socket.on('disconnect', () => this.store.setState({ connected: false }))
    socket.on('connect_error', () => this.store.setState({ connected: false }))
    socket.on('message.created', ({ message }) => this.onMessage(message, true))
    socket.on('message.updated', ({ message }) => this.onMessage(message, false))
    socket.on('message.deleted', ({ message }) => this.onMessage(message, false))
    socket.on('conversation.updated', ({ conversation }) => this.onConversation(conversation))
    socket.on('conversation.deleted', ({ conversationId }) => {
      this.removeFromInbox(conversationId)
      this.forConversation(conversationId, item => item.onDeleted())
    })
    socket.on('conversation.read', ({ conversationId, side, seq }) => {
      this.forConversation(conversationId, item => item.onRead(side, seq))
      if (side === 'OPERATOR') {
        this.patchInbox(conversationId, item =>
          seq >= item.lastSeq ? { ...item, operatorReadSeq: seq, unreadForOperator: 0 } : item,
        )
      }
    })
    socket.on('typing', ({ conversationId, side }) => {
      if (side !== 'CONTACT') return
      const until = Date.now() + SUPPORT_LIMITS.typingTimeoutMs
      this.store.setState(state => ({ typing: { ...state.typing, [conversationId]: until } }))
      // Убираем сами: иначе «печатает…» висит, пока что-то другое не перерисует список
      setTimeout(() => {
        if (this.store.getState().typing[conversationId] !== until) return
        this.store.setState(state => {
          const { [conversationId]: _expired, ...typing } = state.typing
          return { typing }
        })
      }, SUPPORT_LIMITS.typingTimeoutMs)
    })
    socket.on('presence', ({ operatorsOnline }) => this.store.setState({ operatorsOnline }))

    this.detachWake = watchWake(() => {
      if (!socket.connected) socket.connect()
    })
    socket.connect()
    void this.reloadInbox()
  }

  public disconnect(): void {
    this.detachWake()
    this.socket?.disconnect()
    this.socket = null
    this.store.setState({ connected: false })
  }

  // ── Инбокс ─────────────────────────────────────────────────────────────────

  public setFilters(patch: Partial<SupportInboxFilters>): void {
    // Смена фильтра — снова с первой страницы
    this.store.setState(state => ({ filters: { ...state.filters, page: 1, ...patch } }))
    void this.reloadInbox()
  }

  public setPage(page: number): void {
    this.store.setState(state => ({ filters: { ...state.filters, page } }))
    void this.reloadInbox()
  }

  public async reloadInbox(): Promise<void> {
    const request = ++this.reloadRequest
    const { filters } = this.store.getState()
    this.store.setState(state => ({ inbox: { ...state.inbox, loading: true, error: null } }))
    try {
      const page = await this.http.get<PageResponse>('/support/operator/conversation/list', {
        page: filters.page,
        limit: filters.limit,
        search: filters.search.trim() || undefined,
        filter_status: filters.status.length ? filters.status : undefined,
        filter_assignee: filters.assignee === 'all' ? undefined : filters.assignee,
        filter_channel: filters.channel,
        add_contact: true,
        add_last_message: true,
      })
      if (request !== this.reloadRequest) return
      this.store.setState({
        inbox: {
          items: page.items,
          total: page.meta.total,
          totalPages: page.meta.totalPages,
          loading: false,
          error: null,
        },
      })
    } catch (error) {
      if (request !== this.reloadRequest) return
      this.store.setState(state => ({
        inbox: {
          ...state.inbox,
          loading: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить',
        },
      }))
    }
  }

  /** Открыть диалог: своя лента, отправка, действия. Закрыть — conversation.dispose(). */
  public openConversation(id: number): SupportOperatorConversation {
    const conversation = new SupportOperatorConversation(this, id, () => {
      this.conversations.delete(conversation)
    })
    this.conversations.add(conversation)
    void conversation.load()
    return conversation
  }

  /** @internal — отправка «печатает…» из открытого диалога */
  public emitTyping(conversationId: number, internal: boolean): void {
    if (this.socket?.connected) this.socket.emit('typing', { conversationId, internal })
  }

  /** @internal — диалог изменился через REST: обновить в инбоксе, не дожидаясь сокета */
  public upsertInbox(conversation: SupportConversation): void {
    this.onConversation(conversation)
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private onMessage(message: SupportMessage, created: boolean): void {
    this.forConversation(message.conversationId, item => item.timeline.apply(message))

    const known = this.store.getState().inbox.items.some(item => item.id === message.conversationId)
    if (!known) {
      // Новый диалог или вне текущей страницы — пусть решит сервер с его фильтрами и сортировкой
      if (created) this.scheduleReload()
      return
    }
    this.patchInbox(message.conversationId, item => {
      const isLast = !item.lastMessage || message.seq >= item.lastMessage.seq
      return {
        ...item,
        lastMessage: isLast ? message : item.lastMessage,
        lastMessageAt: created ? message.createdAt : item.lastMessageAt,
        lastSeq: Math.max(item.lastSeq, message.seq),
        unreadForOperator:
          created && message.author === 'CONTACT' ? item.unreadForOperator + 1 : item.unreadForOperator,
      }
    })
    if (created) this.sortInbox()
  }

  private onConversation(conversation: SupportConversation): void {
    this.forConversation(conversation.id, item => item.onConversation(conversation))
    const { inbox, filters } = this.store.getState()
    const index = inbox.items.findIndex(item => item.id === conversation.id)

    if (!this.matches(conversation, filters)) {
      if (index >= 0) this.removeFromInbox(conversation.id)
      return
    }
    if (index < 0) {
      this.scheduleReload()
      return
    }
    // Счётчики и последнее сообщение в событии могут отсутствовать — сохраняем известные
    this.patchInbox(conversation.id, item => ({
      ...item,
      ...conversation,
      contact: conversation.contact ?? item.contact,
      lastMessage: conversation.lastMessage ?? item.lastMessage,
    }))
  }

  private matches(conversation: SupportConversation, filters: SupportInboxFilters): boolean {
    if (filters.status.length && !filters.status.includes(conversation.status)) return false
    if (filters.assignee === 'none' && conversation.assigneeId !== null) return false
    if (filters.channel && conversation.sourceChannel !== filters.channel) return false
    // «Мои» без id текущего оператора на клиенте не проверить — оставляем решение серверу
    return true
  }

  private patchInbox(id: number, update: (item: SupportConversation) => SupportConversation): void {
    this.store.setState(state => ({
      inbox: { ...state.inbox, items: state.inbox.items.map(item => (item.id === id ? update(item) : item)) },
    }))
  }

  private removeFromInbox(id: number): void {
    this.store.setState(state => ({
      inbox: {
        ...state.inbox,
        items: state.inbox.items.filter(item => item.id !== id),
        total: Math.max(0, state.inbox.total - 1),
      },
    }))
  }

  private sortInbox(): void {
    const time = (item: SupportConversation) => (item.lastMessageAt ? Date.parse(item.lastMessageAt) : 0)
    this.store.setState(state => ({
      inbox: { ...state.inbox, items: [...state.inbox.items].sort((a, b) => time(b) - time(a) || b.id - a.id) },
    }))
  }

  private scheduleReload(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    this.reloadTimer = setTimeout(() => {
      this.reloadTimer = null
      void this.reloadInbox()
    }, RELOAD_DEBOUNCE_MS)
  }

  private forConversation(id: number, action: (item: SupportOperatorConversation) => void): void {
    this.conversations.forEach(item => {
      if (item.id === id) action(item)
    })
  }
}

export interface SupportOperatorConversationState {
  conversation: SupportConversation | null
  loading: boolean
  error: string | null
  /** Диалог удалили, пока он был открыт. */
  deleted: boolean
}

/** Открытый оператором диалог. */
export class SupportOperatorConversation {
  public readonly store = new StateStore<SupportOperatorConversationState>({
    conversation: null,
    loading: false,
    error: null,
    deleted: false,
  })

  public readonly timeline: SupportTimeline

  private typingSentAt = 0

  constructor(
    private readonly client: SupportOperatorClient,
    public readonly id: number,
    private readonly onDispose: () => void,
  ) {
    this.timeline = new SupportTimeline({
      author: 'OPERATOR',
      api: {
        list: params => client.http.get<SupportCursorPage<SupportMessage>>('/support/operator/message/list', params),
        create: form => client.http.post<SupportMessage>('/support/operator/message/create', form),
      },
    })
  }

  // ── Жизненный цикл ─────────────────────────────────────────────────────────

  public async load(): Promise<void> {
    this.store.setState({ loading: true, error: null })
    try {
      const conversation = await this.client.http.get<SupportConversation>(`/support/operator/conversation/${this.id}`)
      this.store.setState({ conversation })
      await this.timeline.setConversation(this.id)
      this.timeline.resume()
    } catch (error) {
      this.store.setState({ error: error instanceof Error ? error.message : 'Не удалось открыть диалог' })
    } finally {
      this.store.setState({ loading: false })
    }
  }

  public sync(): Promise<void> {
    return this.timeline.sync()
  }

  public dispose(): void {
    this.timeline.destroy()
    this.onDispose()
  }

  // ── Сообщения ──────────────────────────────────────────────────────────────

  /**
   * replyTo — сообщение ленты, на которое отвечаем. actions — ключи кнопок-действий проекта: в историю
   * не попадают, сервер передаёт их мостам в мессенджеры (у заметки игнорируются).
   */
  public send(
    text: string,
    files: File[] = [],
    options: { internal?: boolean; replyTo?: SupportMessage | null; actions?: string[] } = {},
  ): void {
    if (!text.trim() && files.length === 0) return
    this.timeline.send(
      text,
      files.slice(0, SUPPORT_LIMITS.attachmentsMax),
      {
        conversationId: String(this.id),
        isInternalNote: String(options.internal ?? false),
        ...(options.actions?.length && !options.internal ? { actions: options.actions.join(',') } : {}),
      },
      options.replyTo ? toSupportReply(options.replyTo) : null,
    )
  }

  /** internal — пишется заметка: «печатает…» увидят только коллеги. */
  public notifyTyping(options: { internal?: boolean } = {}): void {
    const now = Date.now()
    if (now - this.typingSentAt < SUPPORT_LIMITS.typingThrottleMs) return
    this.typingSentAt = now
    this.client.emitTyping(this.id, options.internal ?? false)
  }

  public async markRead(): Promise<void> {
    const conversation = this.store.getState().conversation
    const seq = this.timeline.lastSeq
    if (!conversation || seq <= conversation.operatorReadSeq) return
    this.store.setState({ conversation: { ...conversation, operatorReadSeq: seq, unreadForOperator: 0 } })
    try {
      const updated = await this.client.http.post<SupportConversation>('/support/operator/conversation/read', {
        conversationId: this.id,
        seq,
      })
      this.applyUpdate(updated)
    } catch {
      // Не критично: при следующем открытии отметим снова
    }
  }

  public async editMessage(id: number, text: string): Promise<void> {
    const message = await this.client.http.post<SupportMessage>(`/support/operator/message/update/${id}`, { text })
    this.timeline.apply(message)
  }

  public async deleteMessage(id: number): Promise<void> {
    const message = await this.client.http.post<SupportMessage>(`/support/operator/message/delete/${id}`)
    this.timeline.apply(message)
  }

  // ── Действия с диалогом ────────────────────────────────────────────────────

  public update(patch: SupportConversationPatch): Promise<void> {
    return this.action(`/support/operator/conversation/update/${this.id}`, patch)
  }

  public assignToMe(): Promise<void> {
    return this.action(`/support/operator/conversation/assign/${this.id}`)
  }

  public close(): Promise<void> {
    return this.action(`/support/operator/conversation/close/${this.id}`)
  }

  public reopen(): Promise<void> {
    return this.action(`/support/operator/conversation/reopen/${this.id}`)
  }

  // ── События (вызывает SupportOperatorClient) ───────────────────────────────

  /** @internal */
  public onConversation(conversation: SupportConversation): void {
    const current = this.store.getState().conversation
    this.store.setState({
      conversation: { ...current, ...conversation, contact: conversation.contact ?? current?.contact },
    })
  }

  /** @internal */
  public onRead(side: 'CONTACT' | 'OPERATOR', seq: number): void {
    const current = this.store.getState().conversation
    if (!current) return
    this.store.setState({
      conversation:
        side === 'CONTACT'
          ? { ...current, contactReadSeq: Math.max(current.contactReadSeq, seq) }
          : { ...current, operatorReadSeq: Math.max(current.operatorReadSeq, seq) },
    })
  }

  /** @internal */
  public onDeleted(): void {
    this.store.setState({ deleted: true })
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private async action(path: string, body?: object): Promise<void> {
    const updated = await this.client.http.post<SupportConversation>(path, body)
    this.applyUpdate(updated)
    // Служебные строки («обращение закрыто») придут сокетом, но не ждём его
    void this.timeline.sync()
  }

  private applyUpdate(conversation: SupportConversation): void {
    this.onConversation(conversation)
    this.client.upsertInbox(conversation)
  }
}
