import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability'
import { useParams } from 'react-router'

import { useMe } from './api'
import type { MeOrganization, OrgRole } from './types'

// Зеркало apps/server/src/common/casl: те же действия, субъекты и правила. Фронт по ним только прячет
// интерфейс — настоящая проверка на сервере. Проект дописывает свои субъекты в обоих местах
export type AppAction = 'manage' | 'read' | 'create' | 'update' | 'delete'
export type AppSubject = 'Organization' | 'Member' | 'Invite' | 'JoinRequest' | 'AuditLog' | 'all'
export type AppAbility = MongoAbility<[AppAction, AppSubject]>

export const defineAbilityFor = (role: OrgRole | null): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  if (role === 'OWNER') {
    can('manage', 'all')
  } else if (role === 'ADMIN') {
    can('read', 'Organization')
    can('manage', ['Member', 'Invite', 'JoinRequest'])
    // На сервере журнал закрыт @RequireOrgRole(ADMIN), а не CASL — здесь то же правило для меню и маршрута
    can('read', 'AuditLog')
  } else if (role === 'MEMBER') {
    can('read', 'Organization')
    // Выход из организации. Кого именно можно удалять, решает сервер
    can('delete', 'Member')
  }

  return build()
}

type CurrentOrganization = {
  /** id из адреса /app/:orgId */
  orgId: number
  organization: MeOrganization | undefined
  /** null — профиль ещё грузится или пользователь не состоит в организации */
  role: OrgRole | null
}

/** Текущая организация кабинета и роль пользователя в ней */
export const useCurrentOrganization = (): CurrentOrganization => {
  const orgId = Number(useParams().orgId)
  const { data: me } = useMe()
  const organization = me?.organizations.find(item => item.id === orgId)
  // Платформенный админ проходит в любую организацию с правами владельца (см. OrgScopeGuard)
  const role = organization?.role ?? (me?.capabilities.isPlatformAdmin ? 'OWNER' : null)

  return { orgId, organization, role }
}

export const useAbility = (): AppAbility => defineAbilityFor(useCurrentOrganization().role)

type CanProps = {
  I: AppAction
  a: AppSubject
  children: React.ReactNode
  /** Что показать вместо скрытого содержимого */
  fallback?: React.ReactNode
}

/** <Can I="manage" a="Invite">…</Can> — содержимое видно только при наличии права */
export const Can = ({ I, a, children, fallback = null }: CanProps) => (useAbility().can(I, a) ? children : fallback)
