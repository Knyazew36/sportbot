import { local } from '@/shared/lib/storage'

const LAST_ORGANIZATION_KEY = 'last_organization_id'

// Источник правды — :orgId в адресе. Loader маршрута кабинета кладёт id сюда до рендера страницы,
// поэтому запросы страницы уже уходят с заголовком организации
let currentOrganizationId: number | null = null

export const getOrganizationId = (): number | null => currentOrganizationId

export const setOrganizationId = (id: number | null): void => {
  currentOrganizationId = id
  if (id !== null) local.set(LAST_ORGANIZATION_KEY, String(id))
}

/** Организация прошлого визита — в неё ведёт корень сайта */
export const getLastOrganizationId = (): number | null => {
  const id = Number(local.get(LAST_ORGANIZATION_KEY))
  return Number.isInteger(id) && id > 0 ? id : null
}

export const forgetLastOrganizationId = (): void => local.remove(LAST_ORGANIZATION_KEY)
