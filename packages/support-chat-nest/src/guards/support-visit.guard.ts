import { SUPPORT_VISIT_HEADER } from '@app/support-chat-core'
import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

import { VisitTokenService } from '../services/visit-token.service'

import type { SupportRequest } from './support-request'

/** Эндпоинты посетителя: токен визита из заголовка x-support-visit. */
@Injectable()
export class SupportVisitGuard implements CanActivate {
  constructor(private readonly tokens: VisitTokenService) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SupportRequest>()
    const contactId = this.tokens.verify(request.header(SUPPORT_VISIT_HEADER))
    if (contactId === null) {
      throw new UnauthorizedException('Сессия чата истекла, откройте чат заново')
    }
    request.supportContactId = contactId
    return true
  }
}
