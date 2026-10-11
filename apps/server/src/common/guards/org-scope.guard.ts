import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { resolveRequiredOrgRoles } from '@/common/decorators/require-org-role.decorator';
import { PrismaService } from 'prisma/prisma.service';

import { RequestWithOrganization } from '../types/request-with-organization';

import { assertOrgAccess } from './org-access';

/**
 * Проверяет доступ пользователя к организации запроса и (опционально) минимальную роль.
 *
 * organizationId ищется по цепочке: params.organizationId → params.orgId →
 * body.organizationId → заголовок x-organization-id → query.organizationId.
 *
 * `User.isPlatformAdmin` проходит всегда (сквозной доступ), роль в request — OWNER.
 * Требуемую роль задаёт `@RequireOrgRole(...)`.
 */
@Injectable()
export class OrgScopeGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const organizationId = this.resolveOrganizationId(request);
    const requiredRoles = resolveRequiredOrgRoles(this.reflector, context);

    const access = await assertOrgAccess(this.prisma, {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
      organizationId,
      requiredRoles,
    });

    request.organizationId = access.organizationId;
    request.orgMembership = access.orgMembership;
    request.orgRole = access.orgRole;
    request.isPlatformAccess = access.isPlatformAccess;
    return true;
  }

  private resolveOrganizationId(request: RequestWithOrganization): number {
    const raw =
      request.params?.organizationId ??
      request.params?.orgId ??
      request.params?.id ??
      (request.body as Record<string, unknown> | undefined)?.organizationId ??
      request.header('x-organization-id') ??
      (request.query as Record<string, unknown> | undefined)?.organizationId;

    if (raw === undefined || raw === null || raw === '') {
      throw new BadRequestException('organizationId обязателен');
    }

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Некорректный organizationId');
    }

    return id;
  }
}
