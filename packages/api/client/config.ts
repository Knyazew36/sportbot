/** Где приложение хранит токен: веб — localStorage/sessionStorage, мобилка — SecureStore с копией в памяти */
export type TokenStore = {
  get: () => string | null
  /** remember=false — токен живёт до закрытия вкладки (только веб) */
  set: (token: string, remember?: boolean) => void
  clear: () => void
}

export type ApiLogEntry = { name: string; data: unknown; type: 'request' | 'response' | 'catch' }

export type ApiConfig = {
  /** Адрес API без завершающего слэша */
  baseURL: string
  tokens: TokenStore
  /** Авторизация без токена: в мини-приложении мессенджера — подписанные данные запуска */
  fallbackAuthorization?: () => string | null
  /** Заголовки на каждый запрос, если вызывающий код не поставил их сам (организация кабинета) */
  headers?: () => Record<string, string>
  /** Смена сессии снаружи приложения: вход или выход в соседней вкладке браузера */
  subscribeExternal?: (callback: () => void) => () => void
  log?: (entry: ApiLogEntry) => void
}

let config: ApiConfig | null = null

/** Вызывается один раз при старте приложения, до первого запроса */
export const configureApi = (next: ApiConfig): void => {
  // baseURL часто задают руками (EXPO_PUBLIC_API_URL), слэш на конце даёт двойной в asset-ссылках
  config = { ...next, baseURL: next.baseURL.replace(/\/+$/, '') }
}

export const getApiConfig = (): ApiConfig => {
  if (!config) throw new Error('@sportbot/api: configureApi() не вызван до первого запроса')
  return config
}
