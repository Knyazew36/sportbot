import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrgRole } from '@/generated/prisma/client';

export const REQUIRE_ORG_ROLE_KEY = 'require_org_role';

/** Читает требуемые роли с хендлера/класса. Используют OrgScopeGuard, ResourceScopeGuard. */
export const resolveRequiredOrgRoles = (
  reflector: Reflector,
  context: ExecutionContext,
): OrgRole[] =>
  reflector.getAllAndOverride<OrgRole[]>(REQUIRE_ORG_ROLE_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) ?? [];

/**
 * Минимальная роль в организации для доступа к ручке. Проверяется `OrgScopeGuard`.
 * Роли иерархичны: OWNER > ADMIN > MEMBER. `@RequireOrgRole(OrgRole.ADMIN)` пропускает и OWNER.
 * Без декоратора (или с пустым списком) достаточно любого членства в организации.
 * `User.isPlatformAdmin` проходит всегда.
 */
export const RequireOrgRole = (...roles: OrgRole[]) =>
  SetMetadata(REQUIRE_ORG_ROLE_KEY, roles);
