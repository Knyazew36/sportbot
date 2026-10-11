import { ForbiddenException } from '@nestjs/common';

import { OrganizationMembership, OrgRole } from '@/generated/prisma/client';
import {
  isOrganizationAvailable,
  ORGANIZATION_AVAILABILITY_SELECT,
} from '../organization/organization-availability';
import { PrismaService } from 'prisma/prisma.service';

// Иерархия ролей организации: чем больше число, тем шире права.
export const ROLE_RANK: Record<OrgRole, number> = {
  [OrgRole.MEMBER]: 1,
  [OrgRole.ADMIN]: 2,
  [OrgRole.OWNER]: 3,
};

/** Пропускает роль, если её ранг не ниже минимального среди требуемых. Пустой список — любой роли достаточно. */
export function hasRequiredOrgRole(
  role: OrgRole,
  requiredRoles: OrgRole[],
): boolean {
  if (requiredRoles.length === 0) return true;
  const minRank = Math.min(...requiredRoles.map((r) => ROLE_RANK[r]));
  return ROLE_RANK[role] >= minRank;
}

export interface OrgAccess {
  organizationId: number;
  /** строка членства; null при доступе через User.isPlatformAdmin */
  orgMembership: OrganizationMembership | null;
  /** роль в организации: из членства либо OWNER-эквивалент для платформенного админа */
  orgRole: OrgRole;
  /** true — доступ выдан через User.isPlatformAdmin, а не через строку членства */
  isPlatformAccess: boolean;
}

export interface AssertOrgAccessParams {
  userId: number;
  isPlatformAdmin: boolean;
  organizationId: number;
  requiredRoles: OrgRole[];
}

/**
 * Проверяет доступ пользователя к организации и минимальную роль.
 *
 * `isPlatformAdmin` проходит всегда (сквозной доступ), роль — OWNER.
 * Иначе нужна строка `OrganizationMembership` активной организации с достаточной ролью.
 * Бросает `ForbiddenException` при отсутствии членства / неактивной организации / нехватке роли.
 */
export async function assertOrgAccess(
  prisma: PrismaService,
  {
    userId,
    isPlatformAdmin,
    organizationId,
    requiredRoles,
  }: AssertOrgAccessParams,
): Promise<OrgAccess> {
  if (isPlatformAdmin) {
    return {
      organizationId,
      orgMembership: null,
      orgRole: OrgRole.OWNER,
      isPlatformAccess: true,
    };
  }

  const membership = await prisma.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    include: { organization: { select: ORGANIZATION_AVAILABILITY_SELECT } },
  });

  if (!membership) {
    throw new ForbiddenException('Нет доступа к этой организации');
  }

  if (!isOrganizationAvailable(membership.organization)) {
    throw new ForbiddenException('Организация недоступна');
  }

  if (!hasRequiredOrgRole(membership.role, requiredRoles)) {
    throw new ForbiddenException('Недостаточно прав в организации');
  }

  const { organization: _organization, ...orgMembership } = membership;

  return {
    organizationId,
    orgMembership,
    orgRole: membership.role,
    isPlatformAccess: false,
  };
}
