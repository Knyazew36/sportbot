// Моки админки (frontend-tz, раздел 14): очередь модерации, жалобы, пользователи, отчёт импорта

export type ModerationRequest = {
  id: number
  kind: 'exercise' | 'stretch'
  author: string
  name: string
  /** Коды мышц, выбранные автором */
  muscles: string[]
  /** Текст техники или «как делать», если автор заполнил */
  text: string | null
  videoUrl: string | null
  holdSeconds?: number
  perSide?: boolean
  createdAt: string
  /** Похожие записи общего справочника — кандидаты в «дубль» */
  similarIds: number[]
}

export const moderationQueue: ModerationRequest[] = [
  {
    id: 1,
    kind: 'exercise',
    author: 'Сергей',
    name: 'Молотки с гантелями сидя',
    muscles: ['biceps', 'forearms'],
    text: 'Сидя, гантели нейтральным хватом. Поднимай по очереди, локти прижаты.',
    videoUrl: null,
    createdAt: '13 октября, 21:40',
    similarIds: [7],
  },
  {
    id: 2,
    kind: 'exercise',
    author: 'Маша',
    name: 'Тяга верхнего блока широким хватом',
    muscles: ['lats'],
    text: null,
    videoUrl: 'https://youtu.be/example',
    createdAt: '13 октября, 18:05',
    similarIds: [6, 5],
  },
  {
    id: 3,
    kind: 'stretch',
    author: 'Дима',
    name: 'Растяжка груди у шведской стенки',
    muscles: ['chest', 'front-delts'],
    text: 'Возьмись рукой за перекладину на уровне плеча и разверни корпус в другую сторону.',
    videoUrl: null,
    holdSeconds: 30,
    perSide: true,
    createdAt: '12 октября, 09:12',
    similarIds: [1, 2],
  },
]

export type Complaint = {
  id: number
  kind: 'exercise' | 'stretch'
  catalogId: number
  author: string
  text: string
  createdAt: string
}

export const complaints: Complaint[] = [
  {
    id: 1,
    kind: 'exercise',
    catalogId: 4,
    author: 'Саша',
    text: 'На картинке отжимания от скамьи, а не на брусьях.',
    createdAt: '13 октября',
  },
  {
    id: 2,
    kind: 'stretch',
    catalogId: 4,
    author: 'Маша',
    text: 'Не указано, что нужен турник.',
    createdAt: '11 октября',
  },
  {
    id: 3,
    kind: 'exercise',
    catalogId: 11,
    author: 'Сергей',
    text: 'В технике опечатка: «носки слегка врось».',
    createdAt: '9 октября',
  },
]

export type AdminUser = {
  id: number
  name: string
  messengers: string
  streak: number
  lastSeen: string
  blocked: boolean
  admin?: boolean
}

export const adminUsers: AdminUser[] = [
  { id: 1, name: 'Сергей', messengers: 'Telegram', streak: 12, lastSeen: 'сегодня', blocked: false, admin: true },
  { id: 2, name: 'Саша', messengers: 'Telegram · MAX', streak: 21, lastSeen: 'сегодня', blocked: false },
  { id: 3, name: 'Маша', messengers: 'MAX', streak: 5, lastSeen: 'вчера', blocked: false },
  { id: 4, name: 'Дима', messengers: 'Telegram', streak: 0, lastSeen: '3 дня назад', blocked: false },
  { id: 5, name: 'Спамер', messengers: 'Telegram', streak: 0, lastSeen: 'неделю назад', blocked: true },
]

/** Отчёт `POST /admin/import`: сколько создано и обновлено, ошибки по строкам (business-tz, 30.2) */
export const importReport = {
  file: 'catalog.json',
  created: 14,
  updated: 205,
  errors: [
    {
      row: 'exercises[37] «Жим Арнольда»',
      message: 'Неизвестная мышца «deltoids» — в справочнике мышц такого кода нет',
    },
    { row: 'stretches[12] «Растяжка бицепса»', message: 'Картинка не скачалась (404)' },
    { row: 'programs[3] «Верх / низ»', message: 'Упражнение с кодом «hack-squat» не найдено' },
  ],
}
