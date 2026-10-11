import { DateTime } from 'luxon'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
export const DEFAULT_ZONE = 'Europe/Moscow'

export function isValidStartTime(value: string): boolean {
  return TIME_RE.test(value)
}

export interface ScheduleRuleTiming {
  /** день недели 1..7 (ISO, понедельник = 1) */
  weekday: number
  /** "HH:MM" в локальном времени группы */
  startTime: string
  /** с какой даты правило действует (календарная дата, UTC-полночь) */
  activeFrom: Date
  /** по какую (null = бессрочно) */
  activeTo: Date | null
}

function toUtcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function zoneDay(d: Date, zone: string): DateTime {
  return DateTime.fromObject(
    { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() },
    { zone },
  )
}

/**
 * UTC-моменты начала занятий по правилу в окне [from, to] (обе границы — календарные даты).
 * Локальное время трактуется в таймзоне расписания (DEFAULT_ZONE). День включается, если попадает в
 * [max(from, activeFrom), min(to, activeTo)] и совпадает по `weekday`.
 */
export function ruleOccurrencesUtc(
  rule: ScheduleRuleTiming,
  from: Date,
  to: Date,
): Date[] {
  const match = TIME_RE.exec(rule.startTime)
  if (!match) return []
  const hour = Number(match[1])
  const minute = Number(match[2])
  const zone = DEFAULT_ZONE

  const lowerMs = Math.max(toUtcMidnight(from), toUtcMidnight(rule.activeFrom))
  const upperMs = rule.activeTo
    ? Math.min(toUtcMidnight(to), toUtcMidnight(rule.activeTo))
    : toUtcMidnight(to)
  if (lowerMs > upperMs) return []

  let cursor = zoneDay(new Date(lowerMs), zone)
  const last = zoneDay(new Date(upperMs), zone)
  const result: Date[] = []

  while (cursor <= last) {
    if (cursor.weekday === rule.weekday) {
      const at = cursor.set({ hour, minute, second: 0, millisecond: 0 })
      if (at.isValid) {
        result.push(at.toUTC().toJSDate())
      }
    }
    cursor = cursor.plus({ days: 1 })
  }
  return result
}
