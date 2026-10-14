import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { SportAccountService } from '@/bot/sport-account.service';
import { RequestWithOrganization } from '@/common/types/request-with-organization';

import { channelOf } from '../miniapp-channel';

/** Код ответа, по которому фронт показывает «Доступ закрыт». */
export const BLOCKED_CODE = 'BLOCKED';

/**
 * Заблокированному не открывается ничего (frontend-tz, раздел 3) — проверка на каждом запросе Mini App.
 * Ставить после MultiAuthGuard: он проставляет request.user и authProvider.
 */
@Injectable()
export class SportUserGuard implements CanActivate {
  private readonly logger = new Logger(`📱 ${SportUserGuard.name}`);

  constructor(private readonly accounts: SportAccountService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Пользователь не авторизован');

    const channel = channelOf(request.authProvider);
    if (channel && (await this.accounts.isBlocked(user, channel))) {
      this.logger.warn(
        `Запрос заблокированного: userId=${user.id}, ${channel}, ${request.method} ${request.url}`,
      );
      throw new ForbiddenException({
        message: 'Доступ закрыт',
        code: BLOCKED_CODE,
      });
    }
    return true;
  }
}
