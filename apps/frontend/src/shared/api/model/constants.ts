import { env } from '@/env'

export const apiDomain = env.API_URL

/** Заголовок организации запроса: сервер читает его в OrgScopeGuard, если id нет в params/body/query */
export const ORGANIZATION_HEADER = 'x-organization-id'
