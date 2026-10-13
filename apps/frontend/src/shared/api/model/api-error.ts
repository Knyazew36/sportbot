import { isAxiosError } from 'axios'

import type { ApiErrorBody } from './type'

const DEFAULT_MESSAGE = 'Не удалось выполнить запрос. Попробуйте ещё раз'

const getBody = (error: unknown): Partial<ApiErrorBody> | undefined =>
  isAxiosError<Partial<ApiErrorBody>>(error) ? error.response?.data : undefined

export function getApiErrorMessage(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  const message = getBody(error)?.message

  if (Array.isArray(message)) {
    return message.join(', ') || fallback
  }

  return message || fallback
}

/** HTTP-статус ответа; undefined — запрос не дошёл до сервера (сеть, CORS) */
export const getApiErrorStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined

export const getApiErrorCode = (error: unknown): string | undefined => getBody(error)?.code
