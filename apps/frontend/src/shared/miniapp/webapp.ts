// Возможности мессенджера, которые нужны экранам: кнопка «Назад», вибрация, тема, «Поделиться», разрешение писать.
// Telegram и MAX отдают похожий объект WebApp; чего у площадки нет — тихо пропускаем (frontend-tz, раздел 16)
import { detectPlatform } from './detect-platform'

type Haptic = {
  impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
  notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
}

type BackButton = {
  show?: () => void
  hide?: () => void
  onClick?: (cb: () => void) => void
  offClick?: (cb: () => void) => void
}

export type WebApp = {
  initData?: string
  initDataUnsafe?: { start_param?: string }
  ready?: () => void
  expand?: () => void
  colorScheme?: 'light' | 'dark'
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  setBottomBarColor?: (color: string) => void
  onEvent?: (event: string, cb: () => void) => void
  offEvent?: (event: string, cb: () => void) => void
  BackButton?: BackButton
  HapticFeedback?: Haptic
  openTelegramLink?: (url: string) => void
  openLink?: (url: string) => void
  shareContent?: (text: string, link: string) => void
  requestWriteAccess?: (cb?: (allowed: boolean) => void) => void
}

const webApp = (): WebApp | undefined => {
  const platform = detectPlatform()
  if (platform === 'telegram') return window.Telegram?.WebApp
  if (platform === 'max') return window.WebApp
  return undefined
}

// ── Кнопка «Назад» ───────────────────────────────────────────────────────────

/** Показывает системную кнопку «Назад» и вешает обработчик; вернёт функцию снятия. false — кнопки нет */
export const showBackButton = (onBack: () => void): (() => void) | false => {
  const button = webApp()?.BackButton
  if (!button?.show || !button.onClick) return false
  button.onClick(onBack)
  button.show()
  return () => {
    button.offClick?.(onBack)
    button.hide?.()
  }
}

// ── Вибрация ─────────────────────────────────────────────────────────────────

export const haptic = {
  /** Конец таймера, сохранённый подход */
  success: () => webApp()?.HapticFeedback?.notificationOccurred?.('success'),
  warning: () => webApp()?.HapticFeedback?.notificationOccurred?.('warning'),
  tap: () => webApp()?.HapticFeedback?.impactOccurred?.('light'),
  /** Вне мессенджера — через браузер, если он умеет */
  long: () => {
    const feedback = webApp()?.HapticFeedback
    if (feedback?.notificationOccurred) return feedback.notificationOccurred('success')
    navigator.vibrate?.([200, 100, 200])
  },
}

// ── Тема ─────────────────────────────────────────────────────────────────────

/** Тема мессенджера; null — мессенджер не сообщает, берём системную */
export const getMessengerTheme = (): 'light' | 'dark' | null => webApp()?.colorScheme ?? null

export const onMessengerThemeChange = (cb: () => void): (() => void) => {
  const app = webApp()
  app?.onEvent?.('themeChanged', cb)
  return () => app?.offEvent?.('themeChanged', cb)
}

/** Красит шапку, фон и нижнюю полосу окна мессенджера в цвет приложения (#RRGGBB), иначе там остаётся тема мессенджера */
export const paintMessengerChrome = (color: string) => {
  const app = webApp()
  app?.setHeaderColor?.(color)
  app?.setBackgroundColor?.(color)
  app?.setBottomBarColor?.(color)
}

// ── «Поделиться» ─────────────────────────────────────────────────────────────

/** Штатный диалог площадки, иначе системный share, иначе копирование. Вернёт 'copied', если ссылка в буфере */
export const shareLink = async (url: string, text: string): Promise<'shared' | 'copied'> => {
  const app = webApp()
  const platform = detectPlatform()

  if (platform === 'telegram' && app?.openTelegramLink) {
    const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    app.openTelegramLink(share)
    return 'shared'
  }
  if (platform === 'max' && app?.shareContent) {
    app.shareContent(text, url)
    return 'shared'
  }
  if (navigator.share) {
    try {
      await navigator.share({ url, text })
      return 'shared'
    } catch {
      // пользователь закрыл диалог или share недоступен — копируем
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}

// ── Разрешение писать ────────────────────────────────────────────────────────

/** Есть ли у площадки штатный запрос разрешения. Где нет — подсказка написать боту /start */
export const canRequestWriteAccess = (): boolean => Boolean(webApp()?.requestWriteAccess)

export const requestWriteAccess = (): Promise<boolean> =>
  new Promise(resolve => {
    const request = webApp()?.requestWriteAccess
    if (!request) return resolve(false)
    request(allowed => resolve(Boolean(allowed)))
  })
