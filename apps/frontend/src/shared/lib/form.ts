import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { getFieldErrors } from '@/shared/api'

/**
 * Ошибки полей из 422 сервера — под инпуты формы. Мутации с такими формами ставят meta.inlineFieldErrors,
 * тогда общий тост их не дублирует. @returns были ли ошибки полей
 */
export const applyFieldErrors = <T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean => {
  const fields = Object.entries(getFieldErrors(error))
  for (const [name, message] of fields) setError(name as Path<T>, { type: 'server', message })
  return fields.length > 0
}
