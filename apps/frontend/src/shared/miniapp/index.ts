// Мини-приложения мессенджеров: сервер авторизует запрос по подписанным данным запуска в заголовке
// Authorization со своей схемой (см. apps/server/src/messengers/*/auth/*.strategy.ts).
// Данные появляются, только если страница открыта внутри мессенджера и в index.html подключён его SDK-скрипт
export type MiniappPlatform = 'telegram' | 'max' | 'vk'

type InitDataHost = { initData?: string }

declare global {
  interface Window {
    Telegram?: { WebApp?: InitDataHost }
    WebApp?: InitDataHost
  }
}

type Miniapp = { platform: MiniappPlatform; authorization: string }

const detect = (): Miniapp | null => {
  const telegram = window.Telegram?.WebApp?.initData
  if (telegram) return { platform: 'telegram', authorization: `tma ${telegram}` }

  const max = window.WebApp?.initData
  if (max) return { platform: 'max', authorization: `max ${max}` }

  // VK передаёт параметры запуска в адресе; подпись в них проверяет сервер
  const search = window.location.search.slice(1)
  const params = new URLSearchParams(search)
  if (params.has('vk_user_id') && params.has('sign')) return { platform: 'vk', authorization: `vk ${search}` }

  return null
}

// Определяется один раз при загрузке: после первой навигации SPA параметры запуска из адреса пропадут
const miniapp = detect()

export const getMiniappPlatform = (): MiniappPlatform | null => miniapp?.platform ?? null

export const getMiniappAuthorization = (): string | null => miniapp?.authorization ?? null
