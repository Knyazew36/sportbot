// Возможности мессенджера, которые нужны экранам: кнопка «Назад», вибрация, тема, «Поделиться», разрешение писать.
// Telegram и MAX отдают похожий объект WebApp; чего у площадки нет — тихо пропускаем (frontend-tz, раздел 16).
// Отличия MAX (https://dev.max.ru/docs/webapps/bridge): методы возвращают Promise и отклоняют его там, где возможности
// нет (вибрация на десктопе и в вебе), темы и покраски окна нет вовсе, «Поделиться» принимает объект
import { detectPlatform } from './detect-platform'

/** Telegram ничего не возвращает, MAX — Promise */
type BridgeResult = void | Promise<unknown>

type Haptic = {
  impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => BridgeResult
  notificationOccurred?: (type: 'error' | 'success' | 'warning') => BridgeResult
  selectionChanged?: () => BridgeResult
}

type MaxShareParams = { text?: string; link?: string }

/** Чем закрылось окно оплаты Telegram. pending — оплата ещё идёт, результат придёт позже */
export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending'

type BackButton = {
  show?: () => void
  hide?: () => void
  onClick?: (cb: () => void) => void
  offClick?: (cb: () => void) => void
}

export type WebApp = {
  initData?: string
  initDataUnsafe?: { start_param?: string }
  /** ios, android, tdesktop, macos, weba… */
  platform?: string
  isVersionAtLeast?: (version: string) => boolean
  ready?: () => void
  expand?: () => void
  /** Bot API 8.0: окно на весь экран, поверх — только кнопки мессенджера */
  requestFullscreen?: () => void
  /** Telegram Bot API 7.7, MAX: свайп вниз по контенту не сворачивает приложение */
  disableVerticalSwipes?: () => BridgeResult
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
  /** MAX: системный диалог «Поделиться», в вебе его нет */
  shareContent?: (params: MaxShareParams) => Promise<unknown>
  /** MAX: выбор чата внутри MAX — как t.me/share в Telegram */
  shareMaxContent?: (params: MaxShareParams) => Promise<unknown>
  requestWriteAccess?: (cb?: (allowed: boolean) => void) => void
  /** Telegram Bot API 6.1: окно оплаты счёта по ссылке createInvoiceLink */
  openInvoice?: (url: string, cb?: (status: InvoiceStatus) => void) => void
}

// Отказ MAX — не ошибка приложения: возможности просто нет, а необработанный reject засорил бы консоль
const quiet = (result: BridgeResult) => {
  if (result instanceof Promise) result.catch(() => undefined)
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

const feedback = () => webApp()?.HapticFeedback

export const haptic = {
  /** Конец таймера, сохранённый подход */
  success: () => quiet(feedback()?.notificationOccurred?.('success')),
  warning: () => quiet(feedback()?.notificationOccurred?.('warning')),
  /** Запрос не прошёл */
  error: () => quiet(feedback()?.notificationOccurred?.('error')),
  /** Нажатие кнопки, смена раздела меню */
  tap: () => quiet(feedback()?.impactOccurred?.('light')),
  /** Смена выбора: сегмент, тумблер */
  select: () => quiet(feedback()?.selectionChanged?.()),
  /** Вне мессенджера — через браузер, если он умеет */
  long: () => {
    const notify = feedback()?.notificationOccurred
    if (notify) return quiet(notify('success'))
    navigator.vibrate?.([200, 100, 200])
  },
}

// ── Тема ─────────────────────────────────────────────────────────────────────

/** Тема мессенджера; null — мессенджер не сообщает (MAX), берём системную */
export const getMessengerTheme = (): 'light' | 'dark' | null => webApp()?.colorScheme ?? null

export const onMessengerThemeChange = (cb: () => void): (() => void) => {
  const app = webApp()
  app?.onEvent?.('themeChanged', cb)
  return () => app?.offEvent?.('themeChanged', cb)
}

// Шапка в цвет живой полосы, пока тренировка идёт. Живёт здесь, а не у полосы: перекраска при смене темы
// иначе вернула бы шапке цвет бумаги поверх зелёного
let headerAccent: string | null = null

/** Цвет шапки поверх бумаги (#RRGGBB); null — снова как бумага. Применится при следующей перекраске */
export const setMessengerHeaderAccent = (color: string | null) => {
  headerAccent = color
}

/**
 * Красит шапку, фон и нижнюю полосу окна мессенджера в цвет приложения (#RRGGBB), иначе там остаётся тема мессенджера.
 * В MAX методов нет — шапку он красит сам
 */
export const paintMessengerChrome = (color: string) => {
  const app = webApp()
  app?.setHeaderColor?.(headerAccent ?? color)
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
  if (platform === 'max') {
    // Сначала выбор чата в MAX, как в Telegram; не вышло — системный диалог (в вебе MAX его нет)
    for (const share of [app?.shareMaxContent, app?.shareContent]) {
      if (!share) continue
      try {
        await share.call(app, { text, link: url })
        return 'shared'
      } catch {
        // площадка отказала — пробуем следующий способ
      }
    }
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

// ── Внешние ссылки ───────────────────────────────────────────────────────────

/**
 * Открывает адрес средствами мессенджера: t.me в Telegram — его же чатом, без закрытия приложения,
 * остальное — встроенным браузером. false — площадка не умеет, пусть откроет обычная ссылка
 */
export const openExternalLink = (url: string): boolean => {
  const app = webApp()
  if (detectPlatform() === 'telegram' && /^https:\/\/t\.me\//.test(url) && app?.openTelegramLink) {
    app.openTelegramLink(url)
    return true
  }
  if (!app?.openLink) return false
  app.openLink(url)
  return true
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

// ── Оплата звёздами ──────────────────────────────────────────────────────────

/** Звёзды есть только в Telegram: в MAX, VK и браузере окна оплаты нет */
export const canPayStars = (): boolean => detectPlatform() === 'telegram' && Boolean(webApp()?.openInvoice)

/** Открывает окно оплаты счёта и ждёт, чем оно закроется */
export const openStarsInvoice = (url: string): Promise<InvoiceStatus> =>
  new Promise((resolve, reject) => {
    const open = webApp()?.openInvoice
    if (!open) return reject(new Error('Оплата звёздами доступна только в Telegram'))
    open(url, status => resolve(status))
  })
