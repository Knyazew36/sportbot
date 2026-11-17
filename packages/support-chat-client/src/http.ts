const DEFAULT_ERROR = 'Не удалось выполнить запрос. Попробуйте ещё раз'

/** Ошибка API. status 0 — запрос не дошёл до сервера (сеть, CORS). */
export class SupportApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'SupportApiError'
  }

  /** Повтор может помочь: нет сети или сбой сервера. На 4xx повторять бессмысленно. */
  public get retryable(): boolean {
    return this.status === 0 || this.status >= 500 || this.status === 429
  }
}

export interface SupportHttpOptions {
  /** Адрес API вместе с префиксом: https://api.example.com/api */
  baseUrl: string
  headers: () => Record<string, string>
}

type Query = Record<string, string | number | boolean | undefined | null | string[]>

/** fetch-обёртка: снимает конверт { status, data, timestamp } и превращает ошибки в SupportApiError. */
export class SupportHttp {
  private readonly baseUrl: string

  constructor(private readonly options: SupportHttpOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
  }

  public get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>(`${path}${this.queryString(query)}`, { method: 'GET' })
  }

  public post<T>(path: string, body?: object | FormData, headers?: Record<string, string>): Promise<T> {
    const isForm = body instanceof FormData
    return this.request<T>(path, {
      method: 'POST',
      // Для FormData boundary проставит браузер
      headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: isForm ? body : JSON.stringify(body ?? {}),
    })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.options.headers(), ...(init.headers as Record<string, string> | undefined) },
      })
    } catch {
      throw new SupportApiError(0, 'Нет соединения с сервером')
    }

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      throw new SupportApiError(response.status, this.errorMessage(body))
    }
    return this.unwrap(body) as T
  }

  private unwrap(body: unknown): unknown {
    return body && typeof body === 'object' && 'data' in body && 'status' in body
      ? (body as { data: unknown }).data
      : body
  }

  private errorMessage(body: unknown): string {
    const message = body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined
    if (Array.isArray(message)) return message.join(', ') || DEFAULT_ERROR
    return typeof message === 'string' && message ? message : DEFAULT_ERROR
  }

  private queryString(query?: Query): string {
    if (!query) return ''
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
    const text = params.toString()
    return text ? `?${text}` : ''
  }
}
