// Календарные дни — как на сервере (server bot/bot-time.ts), но строками 'YYYY-MM-DD':
// в таком виде их отдаёт sync/pull и хранит локальная база. Арифметика — в UTC, пояс телефона не влияет

const DAY_MS = 86_400_000

const toUtc = (day: string): number => Date.parse(`${day}T00:00:00Z`)
const fromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/** Сегодняшний календарный день пользователя по его поясу, а не по поясу телефона */
export const localToday = (timeZone: string, now = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export const addDays = (day: string, days: number): string => fromUtc(toUtc(day) + days * DAY_MS)

export const diffDays = (a: string, b: string): number => Math.round((toUtc(a) - toUtc(b)) / DAY_MS)

/** День недели: 0 — воскресенье */
export const weekdayOf = (day: string): number => new Date(toUtc(day)).getUTCDay()

/** Понедельник недели, в которую попадает день */
export const weekStart = (day: string): string => addDays(day, -((weekdayOf(day) + 6) % 7))
