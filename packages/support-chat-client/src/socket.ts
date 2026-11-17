import {
  SUPPORT_SOCKET_NAMESPACE,
  type SupportClientToServerEvents,
  type SupportServerToClientEvents,
  type SupportSocketAuth,
} from '@app/support-chat-core'
import { io, type Socket } from 'socket.io-client'

export type SupportSocket = Socket<SupportServerToClientEvents, SupportClientToServerEvents>

export interface SupportSocketOptions {
  /** Адрес сервера без пути: https://api.example.com */
  url: string
  /** Путь socket.io на сервере, по умолчанию /socket.io */
  path?: string
  /** Читается при каждом (пере)подключении — токен мог обновиться. */
  auth: () => SupportSocketAuth
}

/**
 * Только websocket (как и на сервере): без long-polling не нужны sticky-сессии.
 * Переподключение — экспоненциально с разбросом, чтобы после рестарта сервера клиенты не шли хором.
 */
export const createSupportSocket = (options: SupportSocketOptions): SupportSocket =>
  io(`${options.url.replace(/\/+$/, '')}${SUPPORT_SOCKET_NAMESPACE}`, {
    path: options.path ?? '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.5,
    auth: callback => callback(options.auth()),
  })

/**
 * Вкладка снова видна или вернулась сеть — не ждать таймеров переподключения и повтора.
 * Возвращает отписку.
 */
export const watchWake = (onWake: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined
  const wake = () => {
    if (document.visibilityState !== 'hidden') onWake()
  }
  window.addEventListener('online', wake)
  document.addEventListener('visibilitychange', wake)
  return () => {
    window.removeEventListener('online', wake)
    document.removeEventListener('visibilitychange', wake)
  }
}

/** Адрес сокета по адресу API: https://api.example.com/api → https://api.example.com */
export const socketUrlFromApi = (baseUrl: string): string => new URL(baseUrl).origin
