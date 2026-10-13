// Моковые данные превью: только для оценки дизайна, без API

export type PlanExercise = {
  id: number
  name: string
  muscles: string
  sets: number
  reps: string
  last: string | null
  warning?: string
}

export const today = {
  weekday: 'Вторник',
  date: '13 октября',
  dayNumber: 47,
  program: 'Сила. Сплит на 3 дня',
  complex: { title: 'Грудь', subtitle: 'и трицепс', letter: 'A' },
  rotation: [
    { letter: 'A', title: 'Грудь и трицепс', state: 'next' as const },
    { letter: 'B', title: 'Спина и бицепс', state: 'queued' as const },
    { letter: 'C', title: 'Ноги и плечи', state: 'queued' as const },
  ],
  streak: { current: 12, record: 21 },
  week: [
    { day: 'Пн', state: 'done' as const },
    { day: 'Вт', state: 'today' as const },
    { day: 'Ср', state: 'rest' as const },
    { day: 'Чт', state: 'plan' as const },
    { day: 'Пт', state: 'rest' as const },
    { day: 'Сб', state: 'plan' as const },
    { day: 'Вс', state: 'rest' as const },
  ],
  durationMin: 55,
}

export const plan: PlanExercise[] = [
  { id: 1, name: 'Жим штанги лёжа', muscles: 'Грудь · трицепс', sets: 4, reps: '8–12', last: '60 × 8, 8, 7, 6' },
  {
    id: 2,
    name: 'Жим гантелей на наклонной',
    muscles: 'Верх груди · дельты',
    sets: 3,
    reps: '8–12',
    last: '22 × 10, 10, 8',
    warning: 'нагружает плечо — заменить?',
  },
  { id: 3, name: 'Сведение в кроссовере', muscles: 'Грудь', sets: 3, reps: '12–15', last: '15 × 15, 14, 12' },
  {
    id: 4,
    name: 'Отжимания на брусьях',
    muscles: 'Трицепс · грудь',
    sets: 3,
    reps: '8–12',
    last: 'свой вес × 12, 10, 9',
  },
  { id: 5, name: 'Французский жим', muscles: 'Трицепс', sets: 3, reps: '10–12', last: null },
  { id: 6, name: 'Разгибания на блоке', muscles: 'Трицепс', sets: 3, reps: '12–15', last: '25 × 15, 13, 12' },
]

export const workout = {
  current: 1,
  done: [0],
  sets: [
    { n: 1, weight: '22', reps: '10', saved: true, last: '22 × 10' },
    { n: 2, weight: '24', reps: '9', saved: true, last: '22 × 10' },
    { n: 3, weight: '', reps: '', saved: false, last: '22 × 8' },
  ],
  restSeconds: 90,
  elapsed: '23:41',
}

export const summary = {
  time: '58:12',
  sets: 17,
  exercises: { done: 6, total: 6 },
  streak: 13,
  log: [
    { name: 'Жим штанги лёжа', sets: '62,5 × 8, 8, 7, 6' },
    { name: 'Жим гантелей на наклонной', sets: '22 × 10 · 24 × 9, 8' },
    { name: 'Сведение в кроссовере', sets: '15 × 15, 14, 13' },
    { name: 'Отжимания на брусьях', sets: '12, 10, 10' },
    { name: 'Французский жим', sets: '20 × 12, 10, 10' },
    { name: 'Разгибания на блоке', sets: '25 × 15, 14, 12' },
  ],
}

export const stats = {
  attendance: { week: 67, month: 83 },
  streak: { current: 12, record: 21 },
  weightProgress: [
    { date: '11.08', value: 50 },
    { date: '18.08', value: 52.5 },
    { date: '25.08', value: 52.5 },
    { date: '01.09', value: 55 },
    { date: '08.09', value: 55 },
    { date: '15.09', value: 57.5 },
    { date: '22.09', value: 57.5 },
    { date: '29.09', value: 60 },
    { date: '06.10', value: 60 },
    { date: '13.10', value: 62.5 },
  ],
  muscles: [
    { name: 'Грудь', sets: 14 },
    { name: 'Спина', sets: 12 },
    { name: 'Ноги', sets: 10 },
    { name: 'Плечи', sets: 8.5 },
    { name: 'Трицепс', sets: 7.5 },
    { name: 'Бицепс', sets: 6 },
    { name: 'Пресс', sets: 0, forgotten: true },
    { name: 'Икры', sets: 0, forgotten: true },
  ],
}

export type DayMark = 'done' | 'skip' | 'pause' | 'moved' | 'pending' | 'rest' | 'future'

// Октябрь 2026: 1-е — четверг
export const calendar: { day: number; mark: DayMark }[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  const marks: Record<number, DayMark> = {
    1: 'done',
    3: 'done',
    5: 'done',
    6: 'skip',
    8: 'moved',
    9: 'done',
    10: 'done',
    12: 'done',
    13: 'pending',
  }
  if (day > 13) return { day, mark: [15, 17, 19, 22, 24, 26, 29, 31].includes(day) ? 'future' : 'rest' }
  return { day, mark: marks[day] ?? 'rest' }
})

// ── Программы ───────────────────────────────────────────────────────────────

export type ComplexExercise = { id: number; name: string; muscles: string; sets: number; reps: string; draft?: boolean }

export type Complex = { id: number; letter: string; title: string; exercises: ComplexExercise[] }

export type Program = {
  id: number
  title: string
  active?: boolean
  /** Копия программы друга: имя друга и есть ли у него обновление */
  from?: { name: string; updated: boolean }
  nextComplexId: number
  complexes: Complex[]
}

const chest: ComplexExercise[] = plan.map(e => ({
  id: e.id,
  name: e.name,
  muscles: e.muscles,
  sets: e.sets,
  reps: e.reps,
}))

export const programs: Program[] = [
  {
    id: 1,
    title: 'Сила. Сплит на 3 дня',
    active: true,
    nextComplexId: 11,
    complexes: [
      { id: 11, letter: 'A', title: 'Грудь и трицепс', exercises: chest },
      {
        id: 12,
        letter: 'B',
        title: 'Спина и бицепс',
        exercises: [
          { id: 21, name: 'Подтягивания', muscles: 'Широчайшие · бицепс', sets: 4, reps: '6–10' },
          { id: 22, name: 'Тяга штанги в наклоне', muscles: 'Спина', sets: 3, reps: '8–12' },
          { id: 23, name: 'Тяга верхнего блока', muscles: 'Широчайшие', sets: 3, reps: '10–12' },
          { id: 24, name: 'Подъём штанги на бицепс', muscles: 'Бицепс', sets: 3, reps: '8–12' },
          { id: 25, name: 'Молотки с гантелями', muscles: 'Бицепс · предплечья', sets: 2, reps: '12–15', draft: true },
        ],
      },
      {
        id: 13,
        letter: 'C',
        title: 'Ноги и плечи',
        exercises: [
          { id: 31, name: 'Приседания со штангой', muscles: 'Квадрицепс · ягодицы', sets: 4, reps: '6–10' },
          { id: 32, name: 'Румынская тяга', muscles: 'Бицепс бедра', sets: 3, reps: '8–10' },
          { id: 33, name: 'Жим гантелей сидя', muscles: 'Дельты', sets: 3, reps: '8–12' },
          { id: 34, name: 'Махи в стороны', muscles: 'Средняя дельта', sets: 3, reps: '12–15' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Фулбади дома',
    nextComplexId: 41,
    complexes: [
      { id: 41, letter: 'A', title: 'Всё тело', exercises: [] },
      { id: 42, letter: 'B', title: 'Всё тело, лёгкий', exercises: [] },
    ],
  },
  {
    id: 3,
    title: 'Верх / низ',
    from: { name: 'Саша', updated: true },
    nextComplexId: 51,
    complexes: [
      { id: 51, letter: 'A', title: 'Верх', exercises: [] },
      { id: 52, letter: 'B', title: 'Низ', exercises: [] },
    ],
  },
]

type TemplateExercise = { name: string; muscles: string; sets: number; reps: string }

const ex = (name: string, muscles: string, sets: number, reps: string): TemplateExercise => ({
  name,
  muscles,
  sets,
  reps,
})

export const templates: {
  id: number
  title: string
  description: string
  days: number
  level: string
  complexes: { title: string; exercises: TemplateExercise[] }[]
}[] = [
  {
    id: 1,
    title: 'Новичок. Фулбади',
    description: 'Три тренировки в неделю на всё тело. Базовые движения, чтобы поставить технику.',
    days: 3,
    level: 'новичок',
    complexes: [
      {
        title: 'Всё тело A',
        exercises: [
          ex('Приседания со штангой', 'Квадрицепс · ягодицы', 3, '8–10'),
          ex('Жим штанги лёжа', 'Грудь · трицепс', 3, '8–10'),
          ex('Тяга верхнего блока', 'Широчайшие', 3, '10–12'),
          ex('Скручивания на блоке', 'Пресс', 3, '12–15'),
        ],
      },
      {
        title: 'Всё тело B',
        exercises: [
          ex('Румынская тяга', 'Бицепс бедра', 3, '8–10'),
          ex('Армейский жим', 'Дельты · трицепс', 3, '8–10'),
          ex('Тяга гантели в наклоне', 'Широчайшие', 3, '10–12'),
          ex('Выпады с гантелями', 'Квадрицепс · ягодицы', 2, '10–12'),
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Сила. Сплит на 3 дня',
    description: 'Классический сплит: грудь с трицепсом, спина с бицепсом, ноги с плечами.',
    days: 3,
    level: 'средний',
    complexes: [
      { title: 'Грудь и трицепс', exercises: plan.map(e => ex(e.name, e.muscles, e.sets, e.reps)) },
      {
        title: 'Спина и бицепс',
        exercises: [
          ex('Подтягивания', 'Широчайшие · бицепс', 4, '6–10'),
          ex('Тяга штанги в наклоне', 'Спина', 3, '8–12'),
          ex('Тяга верхнего блока', 'Широчайшие', 3, '10–12'),
          ex('Подъём штанги на бицепс', 'Бицепс', 3, '8–12'),
        ],
      },
      {
        title: 'Ноги и плечи',
        exercises: [
          ex('Приседания со штангой', 'Квадрицепс · ягодицы', 4, '6–10'),
          ex('Румынская тяга', 'Бицепс бедра', 3, '8–10'),
          ex('Жим гантелей сидя', 'Дельты', 3, '8–12'),
          ex('Махи в стороны', 'Средняя дельта', 3, '12–15'),
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Верх / низ',
    description: 'Четыре дня: чередуем верх и низ тела. Для тех, кто тренируется больше года.',
    days: 4,
    level: 'опытный',
    complexes: [
      {
        title: 'Верх',
        exercises: [
          ex('Жим штанги лёжа', 'Грудь · трицепс', 4, '6–8'),
          ex('Подтягивания', 'Широчайшие · бицепс', 4, '6–10'),
          ex('Армейский жим', 'Дельты · трицепс', 3, '8–10'),
          ex('Тяга гантели в наклоне', 'Широчайшие', 3, '10–12'),
        ],
      },
      {
        title: 'Низ',
        exercises: [
          ex('Приседания со штангой', 'Квадрицепс · ягодицы', 4, '6–8'),
          ex('Румынская тяга', 'Бицепс бедра', 3, '8–10'),
          ex('Выпады с гантелями', 'Квадрицепс · ягодицы', 3, '10–12'),
        ],
      },
    ],
  },
]

// ── Профиль ─────────────────────────────────────────────────────────────────

export const profile = {
  name: 'Сергей',
  since: 'с августа 2026',
  streak: 12,
  trainingDays: ['Пн', 'Чт', 'Сб'],
  morningAt: '08:30',
  eveningAt: '20:00',
  timezone: 'Москва',
  restSeconds: 90,
  autoStartRest: true,
  sound: true,
  pause: null as null | { until: string },
  limits: [{ zone: 'Плечо', until: 'до 1 ноября' }],
  bodyWeight: { today: '', last: '82,4', history: [83.6, 83.2, 83.4, 82.9, 82.7, 82.8, 82.4] },
  weightAsk: 'Раз в неделю',
  friends: [
    { id: 1, name: 'Саша', streak: 21, trainedToday: true },
    { id: 2, name: 'Маша', streak: 5, trainedToday: false },
    { id: 3, name: 'Дима', streak: 0, trainedToday: false, paused: true },
  ],
  messengers: [
    { name: 'Telegram', linked: true },
    { name: 'MAX', linked: false },
  ],
  notifyTo: 'Telegram',
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

// ── Профиль друга ───────────────────────────────────────────────────────────

// Что видит друг — по таблице видимости business-tz, раздел 15: факт тренировок, серия, посещаемость,
// комплекс, нагрузка по мышцам, веса и прогресс, статус паузы. Веса тела и ограничений тут нет и быть не должно
export const friendProfiles = [
  {
    id: 1,
    name: 'Саша',
    since: 'друзья с сентября 2026',
    streak: { current: 21, record: 34 },
    attendance: { week: 100, month: 92, weekNote: '3 из 3' },
    trainedToday: 'Ноги и плечи · 61 мин',
    pausedUntil: null as string | null,
    programs: [
      { id: 11, title: 'Верх / низ', complexes: ['Верх', 'Низ'], copied: true },
      {
        id: 12,
        title: 'Сила. Сплит на 3 дня',
        complexes: ['Грудь и трицепс', 'Спина и бицепс', 'Ноги и плечи'],
        copied: false,
      },
    ],
    muscles: [
      { name: 'Ноги', sets: 16 },
      { name: 'Спина', sets: 13 },
      { name: 'Грудь', sets: 12 },
      { name: 'Плечи', sets: 9 },
      { name: 'Руки', sets: 8 },
      { name: 'Пресс', sets: 0, forgotten: true },
    ],
    weightProgress: [
      { label: '11.08', value: 80 },
      { label: '25.08', value: 82.5 },
      { label: '08.09', value: 85 },
      { label: '22.09', value: 87.5 },
      { label: '06.10', value: 90 },
      { label: '13.10', value: 92.5 },
    ],
  },
  {
    id: 2,
    name: 'Маша',
    since: 'друзья с октября 2026',
    streak: { current: 5, record: 12 },
    attendance: { week: 67, month: 75, weekNote: '2 из 3' },
    trainedToday: null as string | null,
    pausedUntil: null as string | null,
    programs: [{ id: 21, title: 'Новичок. Фулбади', complexes: ['Всё тело A', 'Всё тело B'], copied: false }],
    muscles: [
      { name: 'Ноги', sets: 9 },
      { name: 'Грудь', sets: 6 },
      { name: 'Спина', sets: 6 },
      { name: 'Плечи', sets: 0, forgotten: true },
    ],
    weightProgress: [
      { label: '29.09', value: 30 },
      { label: '06.10', value: 32.5 },
      { label: '13.10', value: 35 },
    ],
  },
  {
    id: 3,
    name: 'Дима',
    since: 'друзья с августа 2026',
    streak: { current: 0, record: 18 },
    attendance: { week: 0, month: 40, weekNote: '0 из 3' },
    trainedToday: null as string | null,
    pausedUntil: 'до 1 ноября',
    programs: [
      {
        id: 31,
        title: 'Сила. Сплит на 3 дня',
        complexes: ['Грудь и трицепс', 'Спина и бицепс', 'Ноги и плечи'],
        copied: false,
      },
    ],
    muscles: [],
    weightProgress: [],
  },
]
