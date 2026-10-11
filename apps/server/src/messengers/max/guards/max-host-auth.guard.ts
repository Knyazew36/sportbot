import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';

import { MAX_HOST_AUTH_GUARD } from '../max.constants';

/**
 * Переходник к guard'у авторизации проекта (MaxIntegrationOptions.authGuard).
 *
 * Модуль не знает, как в проекте устроены сессии (JWT, cookie, initData…), а декораторы
 * @UseGuards вычисляются при загрузке файла — до того, как проект передаст свой guard в forRoot.
 * Поэтому контроллер модуля всегда ставит этот guard, а он делегирует guard'у проекта,
 * полученному через DI. От guard'а проекта ожидается одно: положить пользователя в req.user.
 */
@Injectable()
export class MaxHostAuthGuard implements CanActivate {
  constructor(
    @Inject(MAX_HOST_AUTH_GUARD) private readonly hostGuard: CanActivate,
  ) {}

  public canActivate(context: ExecutionContext) {
    return this.hostGuard.canActivate(context);
  }
}
