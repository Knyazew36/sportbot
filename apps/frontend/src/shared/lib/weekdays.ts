// Дни недели с понедельника. value — как у сервера (Date.getDay): 0 — воскресенье
export const WEEKDAYS = [
  { value: 1, short: 'Пн' },
  { value: 2, short: 'Вт' },
  { value: 3, short: 'Ср' },
  { value: 4, short: 'Чт' },
  { value: 5, short: 'Пт' },
  { value: 6, short: 'Сб' },
  { value: 0, short: 'Вс' },
] as const

export const weekdayShort = (value: number): string => WEEKDAYS.find(d => d.value === value)?.short ?? ''
