import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common'

import { SUPPORT_HOST_AUTH_GUARD } from '../support-chat.constants'

/**
 * Переходник к guard'у авторизации проекта (SupportChatModuleOptions.authGuard): в декораторе
 * нельзя сослаться на класс из опций модуля, поэтому guard проекта приходит через DI.
 */
@Injectable()
export class SupportHostAuthGuard implements CanActivate {
  constructor(@Inject(SUPPORT_HOST_AUTH_GUARD) private readonly hostGuard: CanActivate) {}

  public canActivate(context: ExecutionContext) {
    return this.hostGuard.canActivate(context)
  }
}
