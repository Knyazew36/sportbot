import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { resolveRequiredOrgRoles } from '@/common/decorators/require-org-role.decorator';
import { PrismaService } from 'prisma/prisma.service';

import { RequestWithOrganization } from '../types/request-with-organization';

import { assertOrgAccess } from './org-access';

/**
 * Проверяет доступ пользователя к группе запроса (наследует доступ от `Group.organizationId`)
 * и (опционально) минимальную роль в организации.
 *
 * groupId ищется по цепочке: params.id → params.groupId → body.groupId →
 * заголовок x-group-id → query.groupId.
 */
@Injectable()
export class GroupScopeGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithOrganization>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const groupId = this.resolveGroupId(request);
    const requiredRoles = resolveRequiredOrgRoles(this.reflector, context);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { organizationId: true },
    });
    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    const access = await assertOrgAccess(this.prisma, {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
      organizationId: group.organizationId,
      requiredRoles,
    });

    request.groupId = groupId;
    request.organizationId = access.organizationId;
    request.orgMembership = access.orgMembership;
    request.orgRole = access.orgRole;
    request.isPlatformAccess = access.isPlatformAccess;
    return true;
  }

  private resolveGroupId(request: RequestWithOrganization): number {
    const raw =
      request.params?.id ??
      request.params?.groupId ??
      (request.body as Record<string, unknown> | undefined)?.groupId ??
      request.header('x-group-id') ??
      (request.query as Record<string, unknown> | undefined)?.groupId;

    if (raw === undefined || raw === null || raw === '') {
      throw new BadRequestException('groupId обязателен');
    }

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Некорректный groupId');
    }

    return id;
  }
}
