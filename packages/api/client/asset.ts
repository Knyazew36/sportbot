import { getApiConfig } from './config'

// Сервер отдаёт файлы либо своим относительным путём (`/uploads/...`), либо абсолютной ссылкой
// на внешний CDN (аватар из мессенджера). Абсолютный URL префиксовать адресом API нельзя.
export function toAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//.test(url) ? url : `${getApiConfig().baseURL}${url}`
}
