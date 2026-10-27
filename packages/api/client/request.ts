import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { getApiConfig } from './config'
import { clearAccessToken, getAccessToken } from './session'
import type { ApiErrorBody } from './type'

// Без таймаута запрос в зале с плохой сетью висит минутами: лучше упасть и уйти в повтор
const $api = axios.create({ timeout: 15_000 })

// Лог запросов: по нему разбираем проблемы у пользователей (консоль браузера, логи мобилки)
const logName = (config?: InternalAxiosRequestConfig) => `${config?.method?.toUpperCase()} ${config?.url}`

$api.interceptors.request.use(config => {
  const api = getApiConfig()
  config.baseURL ??= api.baseURL

  // Токен появляется только после входа, поэтому заголовок ставится на каждый запрос, а не при создании клиента.
  // В мини-приложении мессенджера токена нет — сервер авторизует по подписанным данным запуска
  const token = getAccessToken()
  const authorization = token ? `Bearer ${token}` : api.fallbackAuthorization?.()
  if (authorization) config.headers.Authorization = authorization

  for (const [name, value] of Object.entries(api.headers?.() ?? {})) {
    if (!config.headers.has(name)) config.headers.set(name, value)
  }

  api.log?.({ name: logName(config), data: { params: config.params, body: config.data }, type: 'request' })
  return config
})

$api.interceptors.response.use(
  response => {
    getApiConfig().log?.({
      name: `${logName(response.config)} → ${response.status}`,
      data: response.data,
      type: 'response',
    })
    return response
  },
  async (error: AxiosError<ApiErrorBody | Blob>) => {
    // У бинарных ручек (responseType: 'blob') JSON-тело ошибки тоже приходит как Blob — перепарсиваем
    const body = error.response?.data
    if (error.response && typeof Blob !== 'undefined' && body instanceof Blob && body.type.includes('json')) {
      try {
        error.response.data = JSON.parse(await body.text()) as ApiErrorBody
      } catch {
        // тело не JSON — оставляем Blob как есть
      }
    }

    // 401 на запросе с токеном — токен протух или отозван: гварды увидят пропажу токена и уведут на вход.
    // Без токена 401 — обычная ошибка формы входа
    if (error.response?.status === 401 && getAccessToken()) clearAccessToken('expired')

    getApiConfig().log?.({
      name: `${logName(error.config)} → ${error.response?.status ?? error.code}`,
      data: error.response?.data ?? error.message,
      type: 'catch',
    })

    throw error
  },
)

export default $api
