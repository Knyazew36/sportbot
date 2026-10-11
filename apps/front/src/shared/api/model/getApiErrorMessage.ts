import { isAxiosError } from 'axios'

const DEFAULT_MESSAGE = 'Не удалось выполнить запрос. Попробуйте ещё раз'

// ValidationPipe на бэке (class-validator) отдаёт message как string[], ручные throw — как string
export function getApiErrorMessage(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  const message = (error.response?.data as { message?: string | string[] } | undefined)?.message

  if (Array.isArray(message)) {
    return message.join(', ') || fallback
  }

  return message || fallback
}
