import { Prisma } from '@/generated/prisma/client';

// Организация доступна, пока не удалена (мягкое удаление — active=false).
export const ORGANIZATION_AVAILABLE_WHERE = {
  active: true,
} satisfies Prisma.OrganizationWhereInput;

export const ORGANIZATION_AVAILABILITY_SELECT = {
  active: true,
} satisfies Prisma.OrganizationSelect;

export function isOrganizationAvailable(organization: {
  active: boolean;
}): boolean {
  return organization.active;
}
