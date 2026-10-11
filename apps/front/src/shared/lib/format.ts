import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

// Макеты живут в одном «сегодня», чтобы просрочки и заезды не плыли со временем
export const DEMO_TODAY = parseISO('2026-10-08T09:40:00')
export const DEMO_TZ = 'МСК'
export const DEMO_TZ_FULL = 'Europe/Moscow, UTC+3'

export const NO_DATA = 'Нет данных'

const toDate = (value: string | Date) => (typeof value === 'string' ? parseISO(value) : value)

// Неизвестная сумма — это «Нет данных», а не 0: ноль утверждает, что денег нет
export const formatMoney = (value: number | null | undefined) =>
  value == null ? NO_DATA : `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

export const formatDate = (value: string | Date, pattern = 'd MMM') => format(toDate(value), pattern, { locale: ru })

export const formatTime = (value: string | Date) => format(toDate(value), 'HH:mm')

export const formatDateTime = (value: string | Date) => `${formatDate(value, 'd MMM, HH:mm')} ${DEMO_TZ}`

export const formatRange = (from: string | Date, to: string | Date) => {
  const a = toDate(from)
  const b = toDate(to)
  const sameMonth = a.getMonth() === b.getMonth()
  return sameMonth
    ? `${format(a, 'd', { locale: ru })}–${format(b, 'd MMM', { locale: ru })}`
    : `${format(a, 'd MMM', { locale: ru })} – ${format(b, 'd MMM', { locale: ru })}`
}

// Ночи считаются до даты выезда (§4.2)
export const nights = (from: string | Date, to: string | Date) => differenceInCalendarDays(toDate(to), toDate(from))

export const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export const pluralize = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`
