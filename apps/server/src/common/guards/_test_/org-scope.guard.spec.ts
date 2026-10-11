import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrgRole } from '@/generated/prisma/client';

import { OrgScopeGuard } from '../org-scope.guard';

type ReqShape = {
  user?: { id: number; isPlatformAdmin?: boolean };
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
};

function makeContext(req: ReqShape): { ctx: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = {
    params: {},
    body: {},
    query: {},
    headers: {},
    ...req,
    header(name: string) {
      return (this.headers as Record<string, string>)[name.toLowerCase()];
    },
  };

  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { ctx, request };
}

describe('OrgScopeGuard', () => {
  let findUnique: jest.Mock;
  let prisma: { organizationMembership: { findUnique: jest.Mock } };
  let reflector: Reflector;
  let guard: OrgScopeGuard;
  let requiredRoles: OrgRole[];

  beforeEach(() => {
    findUnique = jest.fn();
    prisma = { organizationMembership: { findUnique } };
    requiredRoles = [];
    reflector = {
      getAllAndOverride: jest.fn(() => requiredRoles),
    } as unknown as Reflector;
    guard = new OrgScopeGuard(prisma as never, reflector);
  });

  it('отклоняет запрос без аутентифицированного пользователя', async () => {
    const { ctx } = makeContext({ params: { organizationId: '1' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('требует organizationId', async () => {
    const { ctx } = makeContext({ user: { id: 10 } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('403, если у пользователя нет членства в организации', async () => {
    findUnique.mockResolvedValue(null);
    const { ctx } = makeContext({ user: { id: 10 }, params: { organizationId: '5' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('пропускает члена организации и кладёт роль в request', async () => {
    findUnique.mockResolvedValue({
      id: 1,
      organizationId: 5,
      userId: 10,
      role: OrgRole.MEMBER,
      organization: { active: true },
    });
    const { ctx, request } = makeContext({ user: { id: 10 }, params: { organizationId: '5' } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.organizationId).toBe(5);
    expect(request.orgRole).toBe(OrgRole.MEMBER);
    expect(request.isPlatformAccess).toBe(false);
  });

  it('403, если роль ниже требуемой', async () => {
    requiredRoles = [OrgRole.OWNER];
    findUnique.mockResolvedValue({
      id: 1,
      organizationId: 5,
      userId: 10,
      role: OrgRole.MEMBER,
      organization: { active: true },
    });
    const { ctx } = makeContext({ user: { id: 10 }, params: { organizationId: '5' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('OWNER проходит там, где требуется MEMBER (иерархия ролей)', async () => {
    requiredRoles = [OrgRole.MEMBER];
    findUnique.mockResolvedValue({
      id: 1,
      organizationId: 5,
      userId: 10,
      role: OrgRole.OWNER,
      organization: { active: true },
    });
    const { ctx } = makeContext({ user: { id: 10 }, params: { organizationId: '5' } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('платформенный админ проходит без строки членства', async () => {
    requiredRoles = [OrgRole.OWNER];
    const { ctx, request } = makeContext({
      user: { id: 1, isPlatformAdmin: true },
      params: { organizationId: '5' },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
    expect(request.orgRole).toBe(OrgRole.OWNER);
    expect(request.isPlatformAccess).toBe(true);
  });

  it('берёт organizationId из заголовка x-organization-id', async () => {
    findUnique.mockResolvedValue({
      id: 1,
      organizationId: 7,
      userId: 10,
      role: OrgRole.OWNER,
      organization: { active: true },
    });
    const { ctx, request } = makeContext({
      user: { id: 10 },
      headers: { 'x-organization-id': '7' },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.organizationId).toBe(7);
  });
});
