import { Inject, Injectable } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

import { SUPPORT_CHAT_OPTIONS } from '../support-chat.constants'
import type { SupportChatResolvedOptions } from '../support-chat.options'

interface VisitTokenPayload {
  /** id контакта */
  c: number
  /** workspace */
  w: string
  /** истекает, unix ms */
  e: number
}

/**
 * Токен визита: base64url(payload).base64url(hmac). Свой формат, а не JWT проекта — модуль не
 * зависит от авторизации проекта, а токен посетителя не должен открывать API проекта.
 */
@Injectable()
export class VisitTokenService {
  constructor(@Inject(SUPPORT_CHAT_OPTIONS) private readonly options: SupportChatResolvedOptions) {}

  // ── Токен визита ───────────────────────────────────────────────────────────

  public sign(contactId: number): { token: string; expiresAt: Date } {
    const expiresAt = new Date(Date.now() + this.options.visitTokenTtlMs)
    const payload: VisitTokenPayload = { c: contactId, w: this.options.workspaceKey, e: expiresAt.getTime() }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return { token: `${body}.${this.hmac(this.options.secret, body)}`, expiresAt }
  }

  /** id контакта или null, если подпись не сходится, токен истёк или он из другого workspace. */
  public verify(token: string | undefined | null): number | null {
    if (!token) return null
    const [body, signature] = token.split('.')
    if (!body || !signature || !this.safeEqual(signature, this.hmac(this.options.secret, body))) return null

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VisitTokenPayload
      if (payload.w !== this.options.workspaceKey || payload.e < Date.now()) return null
      return Number.isInteger(payload.c) ? payload.c : null
    } catch {
      return null
    }
  }

  // ── Подпись пользователя внешнего сайта ────────────────────────────────────

  /** userHash = hex(HMAC-SHA256(identitySecret, userId)). false — вход выключен или подпись неверна. */
  public verifyUserHash(userId: string, userHash: string): boolean {
    if (!this.options.identitySecret) return false
    const expected = createHmac('sha256', this.options.identitySecret).update(userId).digest('hex')
    return this.safeEqual(userHash.toLowerCase(), expected)
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private hmac(secret: string, value: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url')
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
  }
}
