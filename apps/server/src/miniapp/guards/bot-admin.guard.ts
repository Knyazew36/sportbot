import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { isAdmin } from '@/bot/bot.types';
import { RequestWithOrganization } from '@/common/types/request-with-organization';

/** Администратор спортбота — тот же, что в боте (env ADMIN_*). Ставить после MultiAuthGuard. */
@Injectable()
export class BotAdminGuard implements CanActivate {
  private readonly logger = new Logger(`📱 ${BotAdminGuard.name}`);

  public canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Пользователь не авторизован');
    if (!isAdmin(user)) {
      this.logger.warn(
        `Не администратор стучится в ${request.method} ${request.url}, userId=${user.id}`,
      );
      throw new ForbiddenException('Недоступно');
    }
    return true;
  }
}
