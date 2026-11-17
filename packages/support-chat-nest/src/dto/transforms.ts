// Нормализация на границе (class-transformer): сервисы получают уже чистые значения.

export const trimText = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export const trimToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value

// multipart и query присылают строки
export const toBoolean = ({ value }: { value: unknown }) => value === true || value === 'true'

// multipart: повтор поля даёт массив, одно поле — строку, в ней можно перечислить через запятую
export const toStringList = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  const items = Array.isArray(value) ? value : [value]
  return items
    .flatMap(item => (typeof item === 'string' ? item.split(',') : [item]))
    .map(item => (typeof item === 'string' ? item.trim() : item))
}
