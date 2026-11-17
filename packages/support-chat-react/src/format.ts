import type { SupportMessageAuthor } from '@app/support-chat-client'

import type { SupportLocale } from './locale'

const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' })

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

/** Время сообщения: «11:57 23 октября», не в этом году — с годом. */
export const formatTime = (iso: string): string => {
  const date = new Date(iso)
  const day = (date.getFullYear() === new Date().getFullYear() ? dayMonth : dayMonthYear).format(date)
  return `${time.format(date)} ${day}`
}

/** Разделитель дней в ленте: «Сегодня», «Вчера», «12 октября». */
export const formatDay = (iso: string, locale: SupportLocale): string => {
  const date = new Date(iso)
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000)
  if (days === 0) return locale.today
  if (days === 1) return locale.yesterday
  return (date.getFullYear() === new Date().getFullYear() ? dayMonth : dayMonthYear).format(date)
}

/** Подпись автора: имя, а без него — роль. */
export const authorLabel = (author: SupportMessageAuthor, name: string | null, locale: SupportLocale): string =>
  name ?? (author === 'CONTACT' ? locale.visitor : author === 'OPERATOR' ? locale.operator : locale.support)

export const dayKey = (iso: string): number => startOfDay(new Date(iso))

/** Время в списке диалогов: сегодня — часы, раньше — дата. */
export const formatListTime = (iso: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return startOfDay(date) === startOfDay(new Date()) ? time.format(date) : shortDate.format(date)
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('') || '?'

/** Ссылка на файл: сервер отдаёт путь от своего API, превью до отправки — blob:. */
export const resolveUrl = (url: string, base?: string): string =>
  /^(https?:|blob:|data:)/.test(url) || !base ? url : `${base.replace(/\/+$/, '')}${url}`
