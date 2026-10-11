import { env } from '@/env'

export const apiDomainAccountDev = 'http://localhost:4003/api'

export const apiDomainAccountProd = env.VITE_API_URL_PROD
export const apiDomain = import.meta.env.DEV ? `${apiDomainAccountDev}` : `${apiDomainAccountProd}`

/**
 * Бэк отдаёт avatarUrl либо своим относительным путём (`/uploads/...`), либо
 * абсолютной ссылкой на VK CDN (когда своя аватарка не загружена) — см.
 * resolveAvatarUrl на бэке. Абсолютный URL префиксовать apiDomain нельзя.
 */
export function toAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return /^https?:\/\//.test(url) ? url : `${apiDomain}${url}`
}
