// Разбивка времени тренировки — порт server workout/workout-timing.ts на ISO-строках.
// Событий не храним: отдых выводится из разрывов между doneAt подходов

export type TimingSet = {
  /** Ключ подхода для restBefore */
  key: string
  doneAt: string | null
  workSeconds: number | null
  restTargetSeconds: number | null
}

export type TimingItem = { key: string; superset: number | null; sets: TimingSet[] }

export type WorkoutTiming = {
  warmupSeconds: number
  workSeconds: number
  restSeconds: number
  restCount: number
  restTargetSeconds: number
  restPlannedActualSeconds: number
  tailSeconds: number
  cooldownSeconds: number | null
  /** Фактический отдых перед подходом по ключу подхода; нет ключа — не отдых */
  restBefore: Map<string, number>
}

const seconds = (from: number, to: number): number => Math.max(0, Math.round((to - from) / 1000))

/**
 * С первого подхода человек либо делает подход, либо отдыхает — третьего не бывает: ввод веса,
 * переход к другому упражнению и долгая пауза тоже отдых. null — подходов со временем нет
 */
export const workoutTiming = (workout: {
  startedAt: string
  finishedAt: string | null
  cooldownStartedAt: string | null
  cooldownFinishedAt: string | null
  items: TimingItem[]
}): WorkoutTiming | null => {
  const sets = workout.items
    .flatMap(item =>
      item.sets.map(set => ({
        ...set,
        // Круг суперсета — один блок: его участники записаны одним моментом
        group: item.superset === null ? `e${item.key}` : `s${item.superset}`,
      })),
    )
    .filter((s): s is typeof s & { doneAt: string } => s.doneAt !== null)
    .map(s => ({ ...s, at: Date.parse(s.doneAt) }))
    // Круг суперсета пишется одним моментом: первым идёт подход с временем круга, от него и отдых
    .sort((a, b) => a.at - b.at || Number(a.workSeconds === null) - Number(b.workSeconds === null))
  if (!sets.length) return null

  const timing: WorkoutTiming = {
    warmupSeconds: 0,
    workSeconds: 0,
    restSeconds: 0,
    restCount: 0,
    restTargetSeconds: 0,
    restPlannedActualSeconds: 0,
    tailSeconds: 0,
    cooldownSeconds: null,
    restBefore: new Map(),
  }

  // Всё до первого подхода — разминка: отмеченная на экране разминки и сборы после неё
  let prevEnd = Date.parse(workout.startedAt)
  sets.forEach((set, index) => {
    const prev = index ? sets[index - 1] : null
    // Остальные участники круга записаны тем же моментом: отдыха перед ними нет
    if (prev && prev.group === set.group && prev.at === set.at && set.workSeconds === null) return
    // Начала подхода без секундомера не знаем: весь разрыв до записи идёт в отдых, работа — ноль
    const start = set.workSeconds === null ? set.at : set.at - set.workSeconds * 1000
    const gap = seconds(prevEnd, start)
    timing.workSeconds += set.workSeconds ?? 0
    if (!index) timing.warmupSeconds = gap
    else {
      timing.restSeconds += gap
      timing.restCount += 1
      // Отдых перед ручным подходом включает и сам подход — у подхода его не показываем
      if (set.workSeconds !== null) timing.restBefore.set(set.key, gap)
      if (set.restTargetSeconds !== null) {
        timing.restTargetSeconds += set.restTargetSeconds
        timing.restPlannedActualSeconds += gap
      }
    }
    prevEnd = set.at
  })

  timing.tailSeconds = seconds(prevEnd, workout.finishedAt ? Date.parse(workout.finishedAt) : Date.now())
  if (workout.cooldownStartedAt && workout.cooldownFinishedAt)
    timing.cooldownSeconds = seconds(Date.parse(workout.cooldownStartedAt), Date.parse(workout.cooldownFinishedAt))
  return timing
}

/**
 * Отдых перед каждым подходом одного упражнения — по разрывам между его же подходами (порт server exerciseRests).
 * null — первый подход, без времени или ручной: его отдых включает и сам подход
 */
export const exerciseRests = (sets: { doneAt: string | null; workSeconds: number | null }[]): (number | null)[] =>
  sets.map((set, index) => {
    const prev = index ? sets[index - 1] : null
    if (!prev?.doneAt || !set.doneAt || set.workSeconds === null) return null
    return seconds(Date.parse(prev.doneAt), Date.parse(set.doneAt) - set.workSeconds * 1000)
  })
