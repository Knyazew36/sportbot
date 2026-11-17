import { SupportOperatorClient, SupportVisitorClient } from '@app/support-chat-client'

// ЗАМЕНИТЬ: адрес API проекта вместе с глобальным префиксом (app.setGlobalPrefix), например https://api.example.com/api
export const SUPPORT_API_URL = import.meta.env.VITE_API_URL as string

/** База для путей вложений от сервера (/uploads/...) — тот же адрес API. */
export const SUPPORT_ASSET_BASE_URL = SUPPORT_API_URL

// ЗАМЕНИТЬ: тот же заголовок Authorization, что ставит HTTP-клиент проекта. Нет входа — null (аноним)
const getAuthorization = (): string | null => {
  const token = localStorage.getItem('accessToken')
  return token ? `Bearer ${token}` : null
}

let visitor: SupportVisitorClient | null = null

/** Чат со стороны пользователя — один на вкладку: виджет живёт во всём приложении. */
export const getSupportVisitorClient = (): SupportVisitorClient => {
  visitor ??= new SupportVisitorClient({ baseUrl: SUPPORT_API_URL, getAuthorization })
  return visitor
}

/** Инбокс операторов — создаётся страницей поддержки и закрывается вместе с ней. */
export const createSupportOperatorClient = (): SupportOperatorClient =>
  new SupportOperatorClient({ baseUrl: SUPPORT_API_URL, getAuthorization })
