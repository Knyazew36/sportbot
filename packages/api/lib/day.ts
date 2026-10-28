// Экран «Сегодня» без сервера — порт чистой части server day/day.service.ts.
// Работает на строках локальной базы (дни 'YYYY-MM-DD'); запросов и побочных эффектов здесь нет
import type { DayState, PlanDayStatus, PlanDayType, WeekMark } from '../generated/model'
import { addDays, weekdayOf, weekStart } from './time'

/** Насколько вперёд искать следующий тренировочный день: дальше — расписание фактически пустое */
export const NEXT_HORIZON_DAYS = 60

/** Состояния, в которых экран показывает «что дальше» */
export const NEXT_STATES: DayState[] = ['DONE', 'REST', 'MISSED', 'PAUSE']

export type DayRow = { date: string; type: PlanDayType; status: PlanDayStatus }
export type PauseRow = { startDate: string; endDate: string | null }

type Schedule = { trainingDays: number[] }

/** Пауза, действующая сегодня: снимается только явно, истёкший срок паузу не снимает */
export const activePauseOf = <P extends PauseRow & { endedAt: string | null }>(pauses: P[], today: string): P | null =>
  pauses
    .filter(p => !p.endedAt && p.startDate <= today)
    // Последняя начатая — как orderBy id desc на сервере: у созданной офлайн id ещё нет
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null

/** Одно из состояний дня (frontend-tz, 7) */
export const stateOf = (facts: {
  onboarded: boolean
  current: boolean
  finished: boolean
  paused: boolean
  day: DayRow | null
  hasProgram: boolean
  isTrainingDay: boolean
}): DayState => {
  if (!facts.onboarded) return 'ONBOARDING'
  // Начатая тренировка важнее паузы и расписания: её можно продолжить в любой день
  if (facts.current) return 'IN_PROGRESS'
  if (facts.finished) return 'DONE'
  if (facts.paused) return 'PAUSE'
  if (facts.day?.status === 'MISSED') return 'MISSED'
  if (!facts.hasProgram) return 'NO_PROGRAM'
  // Разовый перенесённый день тоже ждёт тренировки, хоть и не по расписанию
  if (facts.day?.status === 'PENDING' || facts.isTrainingDay) return 'TRAINING'
  return 'REST'
}

/** Комплекс дня: выбранный вручную, иначе по очереди — если он ещё в активной программе */
export const complexOfDay = <T>(pick: { suggested: T | null; next: T | null; allowed: T[] }): T | null =>
  [pick.suggested, pick.next].find((candidate): candidate is T => candidate != null && pick.allowed.includes(candidate)) ??
  null

/** Указатель очереди, как repairPointer на сервере: пропавший комплекс — значит, первый по порядку */
export const nextInQueue = <T>(pointer: T | null, ordered: T[]): T | null =>
  pointer != null && ordered.includes(pointer) ? pointer : (ordered[0] ?? null)

/**
 * Ближайший день после сегодня, когда ждём тренировку: перенесённый (PENDING) или по расписанию,
 * если он не на паузе и не закрыт заранее — внеплановая тренировка засчитывает ближайший будущий день
 */
export const nextTrainingDate = (
  profile: Schedule,
  today: string,
  ahead: Pick<DayRow, 'date' | 'status'>[],
  pause: PauseRow | null,
): string | null => {
  if (pause && !pause.endDate) return null
  for (let offset = 1; offset <= NEXT_HORIZON_DAYS; offset++) {
    const date = addDays(today, offset)
    const day = ahead.find(d => d.date === date)
    if (day?.status === 'PENDING') return date
    if (day) continue
    const paused = !!pause?.endDate && date <= pause.endDate
    if (!paused && profile.trainingDays.includes(weekdayOf(date))) return date
  }
  return null
}

export const markOf = (
  profile: Schedule,
  date: string,
  today: string,
  day: DayRow | undefined,
  trained: boolean,
  pause: PauseRow | null,
): WeekMark => {
  // Внеплановая тренировка закрывает другой день плана, а свою дату — только фактом тренировки,
  // как в календаре статистики
  if (day?.status === 'DONE' || trained) return 'DONE'
  if (day?.status === 'MISSED') return 'MISSED'
  if (day?.status === 'PAUSED') return 'PAUSED'
  const inPause = !!pause && date >= today && date >= pause.startDate && (!pause.endDate || date <= pause.endDate)
  if (inPause) return 'PAUSED'
  // Прошедший день без отметки — вопрос не задавался (например, до настройки)
  if (date < today && !day) return 'REST'
  // Вчерашний день крон закроет позже, но на экране это уже пропуск — как в календаре статистики
  if (day?.status === 'PENDING' && date < today) return day.type === 'RESCHEDULED' ? 'REST' : 'MISSED'
  if (day?.status === 'PENDING') return 'PLAN'
  return profile.trainingDays.includes(weekdayOf(date)) ? 'PLAN' : 'REST'
}

/** Неделя с понедельника: отметки дней плана, впереди — тренировочные дни и пауза */
export const weekOf = (
  profile: Schedule,
  today: string,
  days: DayRow[],
  trainedDates: string[],
  pause: PauseRow | null,
) => {
  const monday = weekStart(today)
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(monday, offset)
    return {
      date,
      weekday: weekdayOf(date),
      mark: markOf(
        profile,
        date,
        today,
        days.find(d => d.date === date),
        trainedDates.includes(date),
        pause,
      ),
      isToday: date === today,
    }
  })
}

/** Разминка тренировки: своя у комплекса, иначе из профиля. null — без разминки */
export const resolveWarmup = (complex: { warmupMinutes: number | null }, profile: { warmupMinutes: number }) =>
  (complex.warmupMinutes ?? profile.warmupMinutes) || null

/** Серия и лучшая серия по отметкам дней от старых к новым — как recalcStreak на сервере */
export const streakOf = (statuses: PlanDayStatus[]) => {
  let current = 0
  let best = 0
  for (const status of statuses) {
    if (status !== 'DONE' && status !== 'MISSED') continue
    current = status === 'DONE' ? current + 1 : 0
    best = Math.max(best, current)
  }
  return { current, best }
}

/** Следующий комплекс очереди после сделанного — как advance на сервере; не из программы — null */
export const advanceQueue = <T>(done: T | null, ordered: T[]): T | null => {
  const index = done == null ? -1 : ordered.indexOf(done)
  return index < 0 ? null : (ordered[(index + 1) % ordered.length] ?? null)
}
