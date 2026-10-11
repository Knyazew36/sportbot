import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { RequestWithOrganization } from '../types/request-with-organization';

/**
 * Пропускает только пользователей с `User.isPlatformAdmin`.
 * Ставить после `MultiAuthGuard` — он проставляет `request.user`.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    if (!user.isPlatformAdmin) {
      throw new ForbiddenException(
        'Требуются права платформенного администратора',
      );
    }

    return true;
  }
}
