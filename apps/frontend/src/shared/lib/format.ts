import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export const NO_DATA = '—'

const toDate = (value: string | Date) => (typeof value === 'string' ? parseISO(value) : value)

export const formatDate = (value: string | Date | null | undefined, pattern = 'd MMM yyyy') =>
  value ? format(toDate(value), pattern, { locale: ru }) : NO_DATA

export const formatDateTime = (value: string | Date | null | undefined) => formatDate(value, 'd MMM yyyy, HH:mm')

export const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export const pluralize = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`

type Named = { name?: string | null; lastName?: string | null; email?: string | null }

/** Имя человека для интерфейса: «Имя Фамилия», иначе email, иначе заглушка */
export const displayName = (person: Named | null | undefined, fallback = 'Без имени') =>
  [person?.name, person?.lastName].filter(Boolean).join(' ') || person?.email || fallback
