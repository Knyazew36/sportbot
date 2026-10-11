import { Prisma } from '@/generated/prisma/client';

// Кружок доступен, если он не удалён (active) и владелец не деактивирован.
// Деактивация владельца = приостановка кружка: отдельного флага в схеме нет.
export const ORGANIZATION_AVAILABLE_WHERE = {
  active: true,
  owner: { active: true },
} satisfies Prisma.OrganizationWhereInput;

export const ORGANIZATION_AVAILABILITY_SELECT = {
  active: true,
  owner: { select: { active: true } },
} satisfies Prisma.OrganizationSelect;

export function isOrganizationAvailable(organization: {
  active: boolean;
  owner: { active: boolean };
}): boolean {
  return organization.active && organization.owner.active;
}
