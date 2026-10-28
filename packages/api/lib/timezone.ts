// Часовой пояс без сервера — копия server profile/profile.service.ts (CITY_ZONES, zoneTitle,
// zoneFromLocalTime) и bot/bot-time.ts (parseUserTime). Список городов меняется вместе с сервером

export const CITY_ZONES: { title: string; zone: string }[] = [
  { title: 'Калининград', zone: 'Europe/Kaliningrad' },
  { title: 'Москва', zone: 'Europe/Moscow' },
  { title: 'Самара', zone: 'Europe/Samara' },
  { title: 'Екатеринбург', zone: 'Asia/Yekaterinburg' },
  { title: 'Омск', zone: 'Asia/Omsk' },
  { title: 'Новосибирск', zone: 'Asia/Novosibirsk' },
  { title: 'Красноярск', zone: 'Asia/Krasnoyarsk' },
  { title: 'Иркутск', zone: 'Asia/Irkutsk' },
  { title: 'Якутск', zone: 'Asia/Yakutsk' },
  { title: 'Владивосток', zone: 'Asia/Vladivostok' },
  { title: 'Магадан', zone: 'Asia/Magadan' },
  { title: 'Камчатка', zone: 'Asia/Kamchatka' },
]

/** Пояс по смещению: Etc/GMT-5 — это UTC+5, знак у Etc обратный */
export const ETC_ZONE = /^Etc\/GMT(?:[+-]\d{1,2})?$/

/** Название пояса для людей: город из списка или «UTC+5» */
export const zoneTitle = (zone: string): string =>
  CITY_ZONES.find(city => city.zone === zone)?.title ??
  zone.replace(/^Etc\/GMT([+-]?)(\d*)$/, (_m, sign: string, hours: string) =>
    hours ? `UTC${sign === '-' ? '+' : '−'}${hours}` : 'UTC',
  )

/** «14:30», «в 9 вечера», «7.15» → «ЧЧ:ММ»; не время — null */
export const parseUserTime = (text: string): string | null => {
  // Запятая и дефис — с телефонной клавиатуры, «в» и точка в конце — из живой речи
  const match =
    /^(?:в\s*)?(\d{1,2})(?:\s*[:.,\-\s]?\s*(\d{2}))?\s*(?:ч|час|часа|часов)?\s*(утра|дня|вечера|ночи)?$/.exec(
      text
        .trim()
        .toLowerCase()
        .replace(/[.!]+$/, '')
        .trim(),
    )
  if (!match) return null
  let hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  if ((match[3] === 'дня' || match[3] === 'вечера') && hour < 12) hour += 12
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** Пояс по «сколько у тебя сейчас»: ближайшее целое смещение от UTC. null — время не разобрать */
export const zoneFromLocalTime = (input: string, now = new Date()): string | null => {
  const time = parseUserTime(input)
  if (!time) return null
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  let offset = Math.round((hour * 60 + minute - utcMinutes) / 60)
  if (offset > 14) offset -= 24
  if (offset < -11) offset += 24
  if (offset === 0) return 'Etc/GMT'
  return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`
}
