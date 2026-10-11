import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { resolveRequiredOrgRoles } from '@/common/decorators/require-org-role.decorator';
import {
  RESOURCE_SCOPE_KEY,
  ScopedResource,
} from '@/common/decorators/resource-scope.decorator';
import { PrismaService } from 'prisma/prisma.service';

import { RequestWithOrganization } from '../types/request-with-organization';

import { assertOrgAccess } from './org-access';

interface ScopeResult {
  organizationId: number;
}

interface ResourceConfig {
  /** имя поля с id: params.<key> / body.<key> / query.<key> / header x-<kebab>-id; кладётся в request.<key> */
  key: string;
  notFound: string;
  load(prisma: PrismaService, id: number): Promise<ScopeResult | null>;
}

const RESOURCES: Record<ScopedResource, ResourceConfig> = {
  invite: {
    key: 'inviteId',
    notFound: 'Приглашение не найдено',
    load: async (prisma, id) => {
      const row = await prisma.invite.findUnique({
        where: { id },
        select: { organizationId: true },
      });
      return row ? { organizationId: row.organizationId } : null;
    },
  },
  joinRequest: {
    key: 'joinRequestId',
    notFound: 'Заявка не найдена',
    load: async (prisma, id) => {
      const row = await prisma.joinRequest.findUnique({
        where: { id },
        select: { organizationId: true },
      });
      return row ? { organizationId: row.organizationId } : null;
    },
  },
  scheduleRule: {
    key: 'scheduleRuleId',
    notFound: 'Правило расписания не найдено',
    load: async (prisma, id) => {
      const row = await prisma.scheduleRule.findUnique({
        where: { id },
        select: { organizationId: true },
      });
      return row ? { organizationId: row.organizationId } : null;
    },
  },
  lesson: {
    key: 'lessonId',
    notFound: 'Занятие не найдено',
    load: async (prisma, id) => {
      const row = await prisma.lesson.findUnique({
        where: { id },
        select: { organizationId: true },
      });
      return row ? { organizationId: row.organizationId } : null;
    },
  },
};

function headerName(key: string): string {
  return `x-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

/**
 * Единый скоуп-гвард для leaf-сущностей (`invite`, `joinRequest`, `scheduleRule`, `lesson`).
 * Сущность выбирается декоратором `@ResourceScope('...')`. Логика та же, что в `OrgScopeGuard`:
 * `:id` → organizationId → `assertOrgAccess` (+ `@RequireOrgRole`).
 * Кладёт в request `<entity>Id` и данные доступа.
 */
@Injectable()
export class ResourceScopeGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<ScopedResource | undefined>(
      RESOURCE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!resource || !RESOURCES[resource]) {
      throw new InternalServerErrorException(
        'ResourceScopeGuard без @ResourceScope(...)',
      );
    }
    const config = RESOURCES[resource];

    const request = context.switchToHttp().getRequest<RequestWithOrganization>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const id = this.resolveId(request, config.key);
    const requiredRoles = resolveRequiredOrgRoles(this.reflector, context);

    const row = await config.load(this.prisma, id);
    if (!row) {
      throw new NotFoundException(config.notFound);
    }

    const access = await assertOrgAccess(this.prisma, {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
      organizationId: row.organizationId,
      requiredRoles,
    });

    (request as unknown as Record<string, unknown>)[config.key] = id;
    request.organizationId = access.organizationId;
    request.orgMembership = access.orgMembership;
    request.orgRole = access.orgRole;
    request.isPlatformAccess = access.isPlatformAccess;
    return true;
  }

  private resolveId(request: RequestWithOrganization, key: string): number {
    const raw =
      request.params?.[key] ??
      request.params?.id ??
      (request.body as Record<string, unknown> | undefined)?.[key] ??
      request.header(headerName(key)) ??
      (request.query as Record<string, unknown> | undefined)?.[key];

    if (raw === undefined || raw === null || raw === '') {
      throw new BadRequestException(`${key} обязателен`);
    }

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(`Некорректный ${key}`);
    }
    return id;
  }
}
