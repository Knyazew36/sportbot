import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrgRole } from '@/generated/prisma/client';

import { AbilityFactory } from './ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandlerCallback,
} from './check-policies.decorator';

// Строит Ability по роли, которую уже проставил OrgScopeGuard / ResourceScopeGuard (request.orgRole).
// Лишнего похода в БД нет.
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers = this.reflector.getAllAndOverride<PolicyHandlerCallback[]>(
      CHECK_POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!handlers || handlers.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    if (!request.orgRole) {
      throw new ForbiddenException('Нет доступа к этой организации');
    }

    const ability = this.abilityFactory.createForOrganizationMember({
      role: request.orgRole as OrgRole,
    });
    if (!handlers.every((handler) => handler(ability))) {
      throw new ForbiddenException('Недостаточно прав в организации');
    }
    return true;
  }
}
