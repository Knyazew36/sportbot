import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthStrategyRegistry } from '../auth-strategy.registry';
import { RequestWithOrganization } from '../types/request-with-organization';

@Injectable()
export class MultiAuthGuard implements CanActivate {
  constructor(private readonly registry: AuthStrategyRegistry) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithOrganization>();

    const strategy = this.registry.list().find((item) => item.supports(req));

    if (!strategy) {
      throw new UnauthorizedException('Unsupported authorization type');
    }

    const user = await strategy.authenticate(req);

    req.user = user;
    req.authProvider = strategy.provider;

    return true;
  }
}
