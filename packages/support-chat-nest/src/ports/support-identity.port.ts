/** Пользователь проекта, опознанный в запросе посетителя (виджет у залогиненного пользователя). */
export interface SupportUserIdentity {
  externalUserId: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

export interface SupportOperator {
  id: number
  name: string | null
}

/** Минимум запроса, нужный для авторизации: express-запрос или handshake сокета. */
export interface SupportRequestLike {
  headers: Record<string, string | string[] | undefined>
  /** Пользователь, которого положил guard проекта (authGuard), если он отработал. */
  user?: unknown
}

/**
 * Кто есть кто — решает проект. Модуль не знает ни про JWT, ни про модель пользователя.
 */
export abstract class SupportIdentity {
  /** Пользователь проекта по заголовкам запроса (необязательная авторизация). null — аноним. Не бросает. */
  public abstract resolveUser(request: SupportRequestLike): Promise<SupportUserIdentity | null>

  /**
   * Оператор по запросу. В HTTP вызывается после authGuard (request.user заполнен), в сокете —
   * по заголовкам handshake (Authorization собран из auth.token). null — не оператор. Не бросает.
   */
  public abstract resolveOperator(request: SupportRequestLike): Promise<SupportOperator | null>

  /** Оператор по id — при назначении диалога на коллегу. */
  public abstract findOperator(id: number): Promise<SupportOperator | null>
}
