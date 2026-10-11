import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';

import { TELEGRAM_HOST_AUTH_GUARD } from '../telegram.constants';

/**
 * Переходник к guard'у авторизации проекта (TelegramIntegrationOptions.authGuard).
 *
 * Декораторы @UseGuards вычисляются при загрузке файла — до того, как проект передаст свой guard
 * в forRoot. Поэтому контроллер модуля ставит этот guard, а он делегирует guard'у проекта из DI.
 * От guard'а проекта ожидается одно: положить пользователя в req.user.
 */
@Injectable()
export class TelegramHostAuthGuard implements CanActivate {
  constructor(
    @Inject(TELEGRAM_HOST_AUTH_GUARD) private readonly hostGuard: CanActivate,
  ) {}

  public canActivate(context: ExecutionContext) {
    return this.hostGuard.canActivate(context);
  }
}
