import { log } from '@front-cmdt/utils/log'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { getMiniappAuthorization } from '@/shared/miniapp'

import { clearAccessToken, getAccessToken } from './access-token'
import { apiDomain, ORGANIZATION_HEADER } from './constants'
import { getOrganizationId } from './organization-id'
import type { ApiErrorBody } from './type'

const $api = axios.create({ baseURL: apiDomain })

// Лог запросов в консоль браузера — только на деве
const LOG_DISABLED = !import.meta.env.DEV

const logName = (config?: InternalAxiosRequestConfig) => `${config?.method?.toUpperCase()} ${config?.url}`

$api.interceptors.request.use(config => {
  // Токен появляется только после входа, поэтому заголовок ставится на каждый запрос, а не при создании клиента.
  // В мини-приложении мессенджера токена нет — сервер авторизует по подписанным данным запуска
  const token = getAccessToken()
  const authorization = token ? `Bearer ${token}` : getMiniappAuthorization()
  if (authorization) {
    config.headers.Authorization = authorization
  }

  const organizationId = getOrganizationId()
  if (organizationId !== null && !config.headers.has(ORGANIZATION_HEADER)) {
    config.headers.set(ORGANIZATION_HEADER, String(organizationId))
  }

  log({
    name: logName(config),
    data: { params: config.params, body: config.data },
    type: 'request',
    isDisabled: LOG_DISABLED,
  })
  return config
})

$api.interceptors.response.use(
  response => {
    log({
      name: `${logName(response.config)} → ${response.status}`,
      data: response.data,
      type: 'response',
      isDisabled: LOG_DISABLED,
    })
    return response
  },
  async (error: AxiosError<ApiErrorBody | Blob>) => {
    // У бинарных ручек (responseType: 'blob') JSON-тело ошибки тоже приходит как Blob — перепарсиваем
    const body = error.response?.data
    if (error.response && body instanceof Blob && body.type.includes('json')) {
      try {
        error.response.data = JSON.parse(await body.text()) as ApiErrorBody
      } catch {
        // тело не JSON — оставляем Blob как есть
      }
    }

    // 401 на запросе с токеном — токен протух или отозван: гварды увидят пропажу токена и уведут на вход.
    // Без токена 401 — обычная ошибка формы входа
    if (error.response?.status === 401 && getAccessToken()) {
      clearAccessToken()
    }

    log({
      name: `${logName(error.config)} → ${error.response?.status ?? error.code}`,
      data: error.response?.data ?? error.message,
      type: 'catch',
      isDisabled: LOG_DISABLED,
    })

    throw error
  },
)

export default $api
