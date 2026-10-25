// Справочник упражнений и растяжек в форме ответа API Mini App.
// imageUrl: API отдаёт путь статики `/api/uploads/catalog/<uuid>.jpg` (Exercise.imagePath); null — картинки нет, её добавит админ

export type Equipment = 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT'
export type CatalogStatus = 'CATALOG' | 'DRAFT'

export type MuscleDto = { id: number; code: string; name: string }
export type JointDto = { id: number; code: string; name: string }

/** Элемент списка `GET /miniapp/exercises` — ответ `{ items, meta }` */
export type ExerciseListItemDto = {
  id: number
  name: string
  imageUrl: string | null
  equipment: Equipment | null
  status: CatalogStatus
  primaryMuscles: MuscleDto[]
}

/** `GET /miniapp/exercises/:id` */
export type ExerciseDto = ExerciseListItemDto & {
  /** Ключевые пункты техники, затем строка «Ошибки: …» */
  technique: string | null
  videoUrl: string | null
  secondaryMuscles: MuscleDto[]
  joints: JointDto[]
}

/** `GET /miniapp/stretches/:id` (список отдаёт те же поля без howTo) */
export type StretchDto = {
  id: number
  name: string
  imageUrl: string | null
  howTo: string | null
  holdSeconds: number
  /** «На каждую сторону» — время удваивается */
  perSide: boolean
  status: CatalogStatus
  muscles: MuscleDto[]
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  BARBELL: 'Штанга',
  DUMBBELL: 'Гантели',
  MACHINE: 'Тренажёр',
  BODYWEIGHT: 'Свой вес',
}

// Фильтр «группа мышц»: 16 мышц сведены в шесть понятных групп, как кнопки в боте
export const MUSCLE_GROUPS: { label: string; codes: string[] }[] = [
  { label: 'Грудь', codes: ['chest'] },
  { label: 'Спина', codes: ['lats', 'traps', 'lower-back'] },
  { label: 'Плечи', codes: ['front-delts', 'mid-delts', 'rear-delts'] },
  { label: 'Руки', codes: ['biceps', 'triceps', 'forearms'] },
  { label: 'Ноги', codes: ['quads', 'hamstrings', 'glutes', 'adductors', 'calves'] },
  { label: 'Пресс', codes: ['abs'] },
]

export type ModerationOutcome = 'PENDING' | 'APPROVED' | 'APPROVED_EDITED' | 'DUPLICATE' | 'REJECTED'

/** Элемент `GET /miniapp/catalog/mine`: своя запись и исход последней заявки (frontend-tz, 11.5) */
export type MyEntryDto = {
  id: number
  kind: 'exercise' | 'stretch'
  name: string
  muscles: MuscleDto[]
  outcome: ModerationOutcome
  /** Короткая причина от админа */
  reason: string | null
  /** Запись общего справочника: одобренная версия или та, что признана дублем */
  catalogId: number | null
  createdAt: string
}

/** Статус своей записи во вкладке «Мои»: публикация и исход последней заявки */
export type EntryState = 'PRIVATE' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'UNPUBLISHED'

export const ENTRY_STATE_LABEL: Record<EntryState, string> = {
  PRIVATE: 'Личное',
  PENDING: 'На проверке',
  PUBLISHED: 'В справочнике',
  REJECTED: 'Отклонено',
  UNPUBLISHED: 'Снято с публикации',
}

export const entryState = (e: { status: 'CATALOG' | 'DRAFT'; outcome: ModerationOutcome | null }): EntryState => {
  if (e.status === 'CATALOG') return 'PUBLISHED'
  if (e.outcome === 'PENDING') return 'PENDING'
  if (e.outcome === 'REJECTED') return 'REJECTED'
  // Одобренная, но снова личная — администратор убрал её из справочника
  if (e.outcome === 'APPROVED' || e.outcome === 'APPROVED_EDITED') return 'UNPUBLISHED'
  return 'PRIVATE'
}

export const MODERATION_LABEL: Record<ModerationOutcome, string> = {
  PENDING: 'На проверке',
  APPROVED: 'Одобрено',
  APPROVED_EDITED: 'Одобрено с правками',
  DUPLICATE: 'Дубль',
  REJECTED: 'Отклонено',
}
