import * as crypto from 'crypto';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Хранилище одноразовых токенов с TTL для диплинков входа и привязки.
 *
 * In-memory: без Redis и рассчитано на один процесс. Рестарт в окне TTL просто роняет токен —
 * пользователь запросит новую ссылку. При нескольких инстансах сервера нужно заменить
 * на общее хранилище (Redis/БД), иначе бот и браузер попадут в разные процессы.
 *
 * Протухшие записи вычищаются при каждом создании нового токена — отдельный таймер не нужен,
 * а память не растёт от ссылок, которые никто так и не открыл.
 */
export class MaxTokenStore<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number) {}

  // ── Операции ────────────────────────────────────────────────────────────

  /** 24 случайных байта в base64url — 32 символа, укладывается в лимит payload MAX (128). */
  public create(value: T): { token: string; expiresAt: number } {
    this.purgeExpired();
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + this.ttlMs;
    this.entries.set(token, { value, expiresAt });
    return { token, expiresAt };
  }

  /** Посмотреть, не тратя токен. null — нет или протух. */
  public peek(token: string): T | null {
    const entry = this.entries.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(token);
      return null;
    }
    return entry.value;
  }

  /** Заменить значение, сохранив срок жизни. false — токена нет или он протух. */
  public update(token: string, value: T): boolean {
    if (this.peek(token) === null) return false;
    const entry = this.entries.get(token)!;
    this.entries.set(token, { value, expiresAt: entry.expiresAt });
    return true;
  }

  /** Забрать и сразу удалить — второй раз тот же токен не сработает. */
  public consume(token: string): T | null {
    const value = this.peek(token);
    this.entries.delete(token);
    return value;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private purgeExpired(): void {
    const now = Date.now();
    for (const [token, entry] of this.entries) {
      if (entry.expiresAt < now) this.entries.delete(token);
    }
  }
}
