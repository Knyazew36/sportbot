import {
  SUPPORT_LIMITS,
  type SupportCursorPage,
  type SupportMessage,
  type SupportMessageReply,
} from '@app/support-chat-core'

import { SupportApiError } from './http'
import { StateStore } from './state-store'
import { createId, readJson, type SupportStorage } from './storage'

/** sending — в очереди или в пути, sent — подтверждено сервером, failed — сервер отказал (4xx). */
export type SupportLocalStatus = 'sending' | 'sent' | 'failed'

export interface SupportTimelineMessage extends SupportMessage {
  /** Ключ для списков UI: clientMessageId (не меняется от отправки до подтверждения) или id. */
  key: string
  localStatus: SupportLocalStatus
  error: string | null
}

export interface SupportTimelineState {
  conversationId: number | null
  /** По возрастанию seq; неподтверждённые — в конце, в порядке отправки. */
  messages: SupportTimelineMessage[]
  hasMoreBefore: boolean
  loading: boolean
  loadingOlder: boolean
  error: string | null
}

export interface SupportTimelineApi {
  list(params: {
    conversationId: number
    beforeSeq?: number
    afterSeq?: number
    limit?: number
  }): Promise<SupportCursorPage<SupportMessage>>
  create(form: FormData): Promise<SupportMessage>
}

export interface SupportTimelineOptions {
  api: SupportTimelineApi
  /** Кто пишет из этого клиента — для черновика неподтверждённого сообщения. */
  author: SupportMessage['author']
  /** Очередь текстовых сообщений переживает перезагрузку страницы. Файлы — только в памяти. */
  persist?: { storage: SupportStorage; key: string }
  /** Сообщение из другого диалога (у посетителя — новый после закрытого): клиент переключает ленту. */
  onForeignConversation?: (message: SupportMessage) => Promise<void> | void
}

interface OutboxEntry {
  clientMessageId: string
  text: string
  files: File[]
  previews: string[]
  /** Дополнительные поля формы: conversationId, isInternalNote. */
  extra: Record<string, string>
  /** Цитата для ленты, пока сервер не подтвердил; на сервер уходит только id. */
  replyTo: SupportMessageReply | null
  createdAt: string
  attempts: number
  status: 'sending' | 'failed'
  error: string | null
  inFlight: boolean
}

type PersistedEntry = Pick<OutboxEntry, 'clientMessageId' | 'text' | 'extra' | 'createdAt'> &
  Partial<Pick<OutboxEntry, 'replyTo'>>

const RETRY_BASE_MS = 1000
const RETRY_MAX_MS = 30_000

/** Цитата из сообщения ленты — для ответа на него. */
export const toSupportReply = (message: SupportMessage): SupportMessageReply => ({
  id: message.id,
  seq: message.seq,
  author: message.author,
  authorName: message.authorName,
  text: message.text,
  attachmentsCount: message.attachments.length,
  deletedAt: message.deletedAt,
})

/**
 * Лента одного диалога. Источник правды — сервер: сокет приносит подсказки (apply), пропуски в seq
 * и переподключения закрываются добором afterSeq (sync). Отправка — через очередь: сообщение сразу
 * видно в ленте, уходит по одному, при сбое сети повторяется с тем же clientMessageId (сервер не создаст дубль).
 */
export class SupportTimeline {
  public readonly store = new StateStore<SupportTimelineState>({
    conversationId: null,
    messages: [],
    hasMoreBefore: false,
    loading: false,
    loadingOlder: false,
    error: null,
  })

  private readonly confirmed = new Map<number, SupportMessage>()
  private outbox: OutboxEntry[] = []
  private paused = true
  private processing = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private syncing: Promise<void> | null = null
  /** Растёт при смене диалога: ответы запросов к прошлому диалогу отбрасываются. */
  private generation = 0

  constructor(private readonly options: SupportTimelineOptions) {
    this.outbox = this.restoreOutbox()
    this.render()
  }

  // ── Диалог ─────────────────────────────────────────────────────────────────

  public get conversationId(): number | null {
    return this.store.getState().conversationId
  }

  public get lastSeq(): number {
    let max = 0
    this.confirmed.forEach(message => (max = Math.max(max, message.seq)))
    return max
  }

  /** Переключить ленту на диалог и загрузить последние сообщения. Неотправленное остаётся в очереди. */
  public async setConversation(conversationId: number | null): Promise<void> {
    if (conversationId === this.conversationId) return
    this.generation++
    this.confirmed.clear()
    this.store.setState({ conversationId, hasMoreBefore: false, error: null })
    this.render()
    if (conversationId !== null) await this.loadLatest()
  }

  public async loadLatest(): Promise<void> {
    const conversationId = this.conversationId
    if (conversationId === null) return
    const generation = this.generation
    this.store.setState({ loading: true, error: null })
    try {
      const page = await this.options.api.list({ conversationId, limit: SUPPORT_LIMITS.historyPageSize })
      if (generation !== this.generation) return
      page.items.forEach(message => this.confirmed.set(message.id, message))
      this.dropConfirmedFromOutbox(page.items)
      this.store.setState({ hasMoreBefore: page.meta.hasMore })
    } catch (error) {
      if (generation === this.generation) this.store.setState({ error: this.errorText(error) })
    } finally {
      if (generation === this.generation) this.store.setState({ loading: false })
      this.render()
    }
  }

  public async loadOlder(): Promise<void> {
    const { conversationId, hasMoreBefore, loadingOlder } = this.store.getState()
    if (conversationId === null || !hasMoreBefore || loadingOlder) return
    const firstSeq = Math.min(...[...this.confirmed.values()].map(message => message.seq))
    const generation = this.generation
    this.store.setState({ loadingOlder: true })
    try {
      const page = await this.options.api.list({
        conversationId,
        beforeSeq: firstSeq,
        limit: SUPPORT_LIMITS.historyPageSize,
      })
      if (generation !== this.generation) return
      page.items.forEach(message => this.confirmed.set(message.id, message))
      this.store.setState({ hasMoreBefore: page.meta.hasMore })
    } catch (error) {
      if (generation === this.generation) this.store.setState({ error: this.errorText(error) })
    } finally {
      if (generation === this.generation) this.store.setState({ loadingOlder: false })
      this.render()
    }
  }

  /** Догрузить историю вверх, пока в ленте не окажется seq (переход к цитате). false — не нашлось. */
  public async loadUntil(seq: number): Promise<boolean> {
    const generation = this.generation
    const firstSeq = () => Math.min(...[...this.confirmed.values()].map(message => message.seq))
    for (;;) {
      const before = firstSeq()
      if (before <= seq) return true
      if (!this.store.getState().hasMoreBefore || generation !== this.generation) return false
      await this.loadOlder()
      // loadOlder молча выходит, если уже грузится или запрос упал — без продвижения не крутимся
      if (firstSeq() >= before) return false
    }
  }

  /** Добрать всё, что новее afterSeq (по умолчанию — последнего известного). Параллельные вызовы склеиваются. */
  public sync(afterSeq?: number): Promise<void> {
    if (this.conversationId === null) return Promise.resolve()
    this.syncing ??= this.runSync(afterSeq ?? this.lastSeq).finally(() => (this.syncing = null))
    return this.syncing
  }

  /** Событие сокета или ответ на отправку. */
  public apply(message: SupportMessage): void {
    if (message.conversationId !== this.conversationId) {
      void this.options.onForeignConversation?.(message)
      return
    }
    const previousLast = this.lastSeq
    const known = this.confirmed.has(message.id)
    this.confirmed.set(message.id, message)
    this.dropConfirmedFromOutbox([message])
    this.render()

    // Пропуск: пришло n+2 при известном n — что-то потерялось при обрыве, добираем
    if (!known && previousLast > 0 && message.seq > previousLast + 1) {
      void this.sync(previousLast)
    }
  }

  // ── Отправка ───────────────────────────────────────────────────────────────

  /** Поставить в очередь. Возвращает ключ сообщения в ленте. */
  public send(
    text: string,
    files: File[] = [],
    extra: Record<string, string> = {},
    replyTo: SupportMessageReply | null = null,
  ): string {
    const entry: OutboxEntry = {
      clientMessageId: createId(),
      text: text.trim(),
      files,
      previews: files.map(file => URL.createObjectURL(file)),
      extra,
      replyTo,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'sending',
      error: null,
      inFlight: false,
    }
    this.outbox.push(entry)
    this.saveOutbox()
    this.render()
    void this.process()
    return entry.clientMessageId
  }

  public retry(key: string): void {
    const entry = this.outbox.find(item => item.clientMessageId === key)
    if (!entry) return
    entry.status = 'sending'
    entry.error = null
    entry.attempts = 0
    this.render()
    void this.process()
  }

  public discard(key: string): void {
    const entry = this.outbox.find(item => item.clientMessageId === key)
    if (!entry || entry.inFlight) return
    this.removeEntry(entry)
    this.render()
  }

  /** Начать отправлять очередь (у клиента появился токен). */
  public resume(): void {
    this.paused = false
    void this.process()
  }

  public pause(): void {
    this.paused = true
    this.clearRetryTimer()
  }

  /** Сеть вернулась — не ждать таймер повтора. */
  public flush(): void {
    this.clearRetryTimer()
    void this.process()
  }

  public destroy(): void {
    this.pause()
    this.outbox.forEach(entry => entry.previews.forEach(url => URL.revokeObjectURL(url)))
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private async runSync(afterSeq: number): Promise<void> {
    const generation = this.generation
    let cursor = afterSeq
    try {
      for (;;) {
        const conversationId = this.conversationId
        if (conversationId === null) return
        const page = await this.options.api.list({
          conversationId,
          afterSeq: cursor,
          limit: SUPPORT_LIMITS.historyPageMax,
        })
        if (generation !== this.generation) return
        page.items.forEach(message => this.confirmed.set(message.id, message))
        this.dropConfirmedFromOutbox(page.items)
        this.render()
        if (!page.meta.hasMore || page.items.length === 0) return
        cursor = page.items[page.items.length - 1]!.seq
      }
    } catch (error) {
      // Не страшно: следующий connect или событие запустят добор снова
      if (generation === this.generation) this.store.setState({ error: this.errorText(error) })
    }
  }

  /** Очередь уходит строго по одному — так сохраняется порядок сообщений. */
  private async process(): Promise<void> {
    if (this.paused || this.processing) return
    this.processing = true
    try {
      for (;;) {
        const entry = this.outbox.find(item => item.status === 'sending')
        if (!entry || this.paused) return
        entry.inFlight = true
        try {
          const message = await this.options.api.create(this.toForm(entry))
          // Сервер открыл новый диалог: сначала переключаемся, иначе сообщение мигнёт и пропадёт
          if (message.conversationId !== this.conversationId) {
            await this.options.onForeignConversation?.(message)
          }
          this.removeEntry(entry)
          this.apply(message)
        } catch (error) {
          if (error instanceof SupportApiError && !error.retryable) {
            entry.status = 'failed'
            entry.error = error.message
            this.saveOutbox()
            this.render()
            continue
          }
          entry.attempts++
          this.scheduleRetry(entry.attempts)
          return
        } finally {
          entry.inFlight = false
        }
      }
    } finally {
      this.processing = false
    }
  }

  private scheduleRetry(attempts: number): void {
    this.clearRetryTimer()
    const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (attempts - 1))
    // Разброс, чтобы после падения сервера клиенты не повторяли хором
    const jitter = delay * (0.5 + Math.random() * 0.5)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.process()
    }, jitter)
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
  }

  private toForm(entry: OutboxEntry): FormData {
    const form = new FormData()
    if (entry.text) form.append('text', entry.text)
    form.append('clientMessageId', entry.clientMessageId)
    if (entry.replyTo) form.append('replyToId', String(entry.replyTo.id))
    Object.entries(entry.extra).forEach(([key, value]) => form.append(key, value))
    entry.files.forEach(file => form.append('files', file))
    return form
  }

  private dropConfirmedFromOutbox(messages: SupportMessage[]): void {
    const ids = new Set(messages.map(message => message.clientMessageId).filter(Boolean))
    if (!ids.size) return
    this.outbox
      .filter(entry => ids.has(entry.clientMessageId) && !entry.inFlight)
      .forEach(entry => this.removeEntry(entry))
  }

  private removeEntry(entry: OutboxEntry): void {
    entry.previews.forEach(url => URL.revokeObjectURL(url))
    this.outbox = this.outbox.filter(item => item !== entry)
    this.saveOutbox()
  }

  private render(): void {
    const confirmed = [...this.confirmed.values()]
      .sort((a, b) => a.seq - b.seq)
      .map<SupportTimelineMessage>(message => ({
        ...message,
        key: message.clientMessageId ?? `m${message.id}`,
        localStatus: 'sent',
        error: null,
      }))
    const confirmedKeys = new Set(confirmed.map(item => item.clientMessageId))
    const pending = this.outbox
      .filter(entry => !confirmedKeys.has(entry.clientMessageId))
      .map<SupportTimelineMessage>((entry, index) => ({
        id: -(index + 1),
        conversationId: this.conversationId ?? 0,
        seq: Number.MAX_SAFE_INTEGER,
        author: this.options.author,
        authorId: null,
        authorName: null,
        text: entry.text,
        isInternalNote: entry.extra.isInternalNote === 'true',
        clientMessageId: entry.clientMessageId,
        channel: 'WIDGET',
        attachments: entry.files.map((file, fileIndex) => ({
          id: -(fileIndex + 1),
          url: entry.previews[fileIndex]!,
          name: file.name,
          mime: file.type,
          size: file.size,
        })),
        replyTo: entry.replyTo,
        editedAt: null,
        deletedAt: null,
        createdAt: entry.createdAt,
        key: entry.clientMessageId,
        localStatus: entry.status,
        error: entry.error,
      }))
    this.store.setState({ messages: [...confirmed, ...pending] })
  }

  private restoreOutbox(): OutboxEntry[] {
    const persist = this.options.persist
    if (!persist) return []
    return readJson<PersistedEntry[]>(persist.storage, persist.key, []).map(item => ({
      ...item,
      replyTo: item.replyTo ?? null,
      files: [],
      previews: [],
      attempts: 0,
      status: 'sending',
      error: null,
      inFlight: false,
    }))
  }

  private saveOutbox(): void {
    const persist = this.options.persist
    if (!persist) return
    const entries: PersistedEntry[] = this.outbox
      .filter(entry => entry.files.length === 0 && entry.status === 'sending')
      .map(({ clientMessageId, text, extra, createdAt, replyTo }) => ({
        clientMessageId,
        text,
        extra,
        createdAt,
        replyTo,
      }))
    if (entries.length) persist.storage.set(persist.key, JSON.stringify(entries))
    else persist.storage.remove(persist.key)
  }

  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось загрузить сообщения'
  }
}
