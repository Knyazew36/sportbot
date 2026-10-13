// Мини-приложения мессенджеров: сервер авторизует запрос по подписанным данным запуска в заголовке
// Authorization со своей схемой (см. apps/server/src/messengers/*/auth/*.strategy.ts).
// SDK мессенджера подгружает initMiniapp: только свой и только когда страница открыта внутри мессенджера
import { detectPlatform, getHashParam, LAUNCH_DATA_PARAM, type MiniappPlatform } from './detect-platform'
import { loadSdk, type SdkPlatform } from './load-sdk'

export type { MiniappPlatform }

type WebApp = { initData?: string; ready?: () => void; expand?: () => void }

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp }
    WebApp?: WebApp
  }
}

type Miniapp = { platform: MiniappPlatform; authorization: string }

const SCHEME: Record<SdkPlatform, string> = { telegram: 'tma', max: 'max' }

let miniapp: Miniapp | null = null

const getWebApp = (platform: SdkPlatform): WebApp | undefined =>
  platform === 'telegram' ? window.Telegram?.WebApp : window.WebApp

const initSdkPlatform = async (platform: SdkPlatform): Promise<Miniapp | null> => {
  // Читаем до загрузки: SDK и роутер могут изменить адрес
  const fromHash = getHashParam(LAUNCH_DATA_PARAM[platform])

  try {
    await loadSdk(platform)
  } catch (error) {
    // Данные запуска есть и в адресе, авторизация от CDN мессенджера не зависит
    console.warn('[miniapp]', error)
  }

  const webApp = getWebApp(platform)
  webApp?.ready?.()
  if (platform === 'telegram') webApp?.expand?.()

  const initData = webApp?.initData || fromHash
  return initData ? { platform, authorization: `${SCHEME[platform]} ${initData}` } : null
}

// Вызывается один раз до создания роутера: его лоадеры сразу проверяют авторизацию
export const initMiniapp = async (): Promise<void> => {
  const platform = detectPlatform()
  if (!platform) return

  if (platform === 'vk') {
    // VK передаёт параметры запуска в адресе; подпись в них проверяет сервер.
    // После первой навигации SPA они пропадут, поэтому запоминаем сразу
    const search = window.location.search.slice(1)
    const params = new URLSearchParams(search)
    if (params.has('vk_user_id') && params.has('sign')) miniapp = { platform, authorization: `vk ${search}` }
    return
  }

  miniapp = await initSdkPlatform(platform)
}

export const getMiniappPlatform = (): MiniappPlatform | null => miniapp?.platform ?? null

export const getMiniappAuthorization = (): string | null => miniapp?.authorization ?? null
