import { OrgRole } from '@/generated/prisma/client';

/** Роль пользователя в конкретной организации. */
export interface OrgMembershipSummary {
  organizationId: number;
  role: OrgRole;
}

/**
 * Полный набор ролевых связей пользователя. Доменной роли на аккаунте нет —
 * роль выводится из связей.
 */
export interface UserContext {
  userId: number;
  isPlatformAdmin: boolean;
  /** организации, где пользователь состоит (любая роль) */
  orgMemberships: OrgMembershipSummary[];
}

/** Вычисляемые на каждый запрос возможности для GET /me. В БД не хранятся. */
export interface UserCapabilities {
  isPlatformAdmin: boolean;
  isOrgOwner: boolean;
  /** OWNER или ADMIN хотя бы в одной организации */
  isOrgAdmin: boolean;
  isOrgMember: boolean;
}
