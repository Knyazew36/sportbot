import { env } from '@/env'

export const apiDomain = env.API_URL

/** Заголовок организации запроса: сервер читает его в OrgScopeGuard, если id нет в params/body/query */
export const ORGANIZATION_HEADER = 'x-organization-id'

// Сервер отдаёт файлы либо своим относительным путём (`/uploads/...`), либо абсолютной ссылкой
// на внешний CDN (аватар из мессенджера). Абсолютный URL префиксовать apiDomain нельзя.
export function toAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//.test(url) ? url : `${apiDomain}${url}`
}
