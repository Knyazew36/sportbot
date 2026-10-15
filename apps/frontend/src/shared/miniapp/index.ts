// Мини-приложения мессенджеров: сервер авторизует запрос по подписанным данным запуска в заголовке
// Authorization со своей схемой (см. apps/server/src/messengers/*/auth/*.strategy.ts).
// SDK мессенджера подгружает initMiniapp: только свой и только когда страница открыта внутри мессенджера
import { detectPlatform, getHashParam, LAUNCH_DATA_PARAM, type MiniappPlatform } from './detect-platform'
import { devTelegramInitData } from './dev-launch'
import { loadSdk, type SdkPlatform } from './load-sdk'
import type { WebApp } from './webapp'

export type { MiniappPlatform }
export * from './webapp'

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp }
    WebApp?: WebApp
  }
}

type Miniapp = { platform: MiniappPlatform; authorization: string; startParam: string | null }

const SCHEME: Record<SdkPlatform, string> = { telegram: 'tma', max: 'max' }

let miniapp: Miniapp | null = null

const getWebApp = (platform: SdkPlatform): WebApp | undefined =>
  platform === 'telegram' ? window.Telegram?.WebApp : window.WebApp

// Телефон — на весь экран: expand только разворачивает шторку, а шапка Telegram остаётся.
// На десктопе fullscreen растянул бы окно на монитор — там хватает expand
const openTelegramFullscreen = (webApp: WebApp) => {
  webApp.expand?.()
  if (webApp.isVersionAtLeast?.('7.7')) webApp.disableVerticalSwipes?.()
  const phone = webApp.platform === 'ios' || webApp.platform === 'android'
  if (phone && webApp.isVersionAtLeast?.('8.0')) webApp.requestFullscreen?.()
}

// MAX открывает приложение шторкой: без запрета свайп вниз по длинному списку закрыл бы её посреди тренировки
const openMax = (webApp: WebApp) => {
  const result = webApp.disableVerticalSwipes?.()
  if (result instanceof Promise) result.catch(() => undefined)
}

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
  if (platform === 'telegram' && webApp) openTelegramFullscreen(webApp)
  if (platform === 'max' && webApp) openMax(webApp)

  const initData = webApp?.initData || fromHash
  if (!initData) return null
  // Кнопка web_app в Telegram не кладёт start_param в initData — бот передаёт экран в адресе (?startapp=)
  const startParam =
    webApp?.initDataUnsafe?.start_param ??
    new URLSearchParams(initData).get('start_param') ??
    new URLSearchParams(window.location.search).get('startapp')
  return { platform, authorization: `${SCHEME[platform]} ${initData}`, startParam }
}

// Вызывается один раз до создания роутера: его лоадеры сразу проверяют авторизацию
export const initMiniapp = async (): Promise<void> => {
  const platform = detectPlatform()
  if (!platform) {
    // Открыто в браузере на деве — входим моковым пользователем Telegram, если он задан
    const devInitData = devTelegramInitData()
    if (devInitData) miniapp = { platform: 'telegram', authorization: `tma ${devInitData}`, startParam: null }
    return
  }

  if (platform === 'vk') {
    // VK передаёт параметры запуска в адресе; подпись в них проверяет сервер.
    // После первой навигации SPA они пропадут, поэтому запоминаем сразу
    const search = window.location.search.slice(1)
    const params = new URLSearchParams(search)
    if (params.has('vk_user_id') && params.has('sign')) {
      miniapp = { platform, authorization: `vk ${search}`, startParam: null }
    }
    return
  }

  miniapp = await initSdkPlatform(platform)
}

export const getMiniappPlatform = (): MiniappPlatform | null => miniapp?.platform ?? null

export const getMiniappAuthorization = (): string | null => miniapp?.authorization ?? null

/** Параметр запуска из кнопки бота (startapp): по нему приложение открывает нужный экран */
export const getMiniappStartParam = (): string | null => miniapp?.startParam ?? null
