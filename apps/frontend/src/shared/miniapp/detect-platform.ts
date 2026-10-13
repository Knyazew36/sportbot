export type MiniappPlatform = 'telegram' | 'max' | 'vk'

// Имена параметров запуска в hash адреса: по ним площадка видна ещё до загрузки её SDK
export const LAUNCH_DATA_PARAM = { telegram: 'tgWebAppData', max: 'WebAppData' } as const

const STORAGE_KEY = 'miniapp-platform'

const PLATFORMS: readonly string[] = ['telegram', 'max', 'vk']

export const getHashParam = (name: string): string | null =>
  new URLSearchParams(window.location.hash.slice(1)).get(name)

const fromUrl = (): MiniappPlatform | null => {
  if (getHashParam(LAUNCH_DATA_PARAM.telegram)) return 'telegram'
  if (getHashParam(LAUNCH_DATA_PARAM.max)) return 'max'

  const params = new URLSearchParams(window.location.search)
  if (params.has('vk_user_id') && params.has('sign')) return 'vk'

  return null
}

const fromStorage = (): MiniappPlatform | null => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved && PLATFORMS.includes(saved) ? (saved as MiniappPlatform) : null
  } catch {
    return null
  }
}

export const detectPlatform = (): MiniappPlatform | null => {
  const platform = fromUrl()
  if (!platform) return fromStorage()

  // Роутер при первой навигации стирает hash: без записи перезагрузка страницы внутри мессенджера потеряла бы площадку
  try {
    sessionStorage.setItem(STORAGE_KEY, platform)
  } catch {
    // хранилище недоступно — площадка известна до первой перезагрузки
  }
  return platform
}
