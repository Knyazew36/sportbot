import { DEMO_ORG_ID, to } from './paths'

export type ScreenStatus = 'ready' | 'wip' | 'planned'
export type Contour = 'entry' | 'cabinet' | 'employee' | 'guest'

export type ScreenVariant = { label: string; query: string }

export type Screen = {
  id: string
  title: string
  contour: Contour
  phase: number
  href: string
  status: ScreenStatus
  variants?: ScreenVariant[]
}

export const CONTOUR_LABEL: Record<Contour, string> = {
  entry: 'Вход и подключение',
  cabinet: 'Рабочий кабинет',
  employee: 'Кабинет сотрудника',
  guest: 'Гостевой путь',
}

const STATES: ScreenVariant[] = [
  { label: 'пусто', query: 'state=empty' },
  { label: 'ошибка', query: 'state=error' },
  { label: 'нет прав', query: 'state=denied' },
  { label: 'загрузка', query: 'state=loading' },
]

// Единый список экранов итерации: из него строится /pages, чтобы витрина не расходилась с маршрутами
export const SCREENS: Screen[] = [
  {
    id: 'today',
    title: 'Сегодня',
    contour: 'cabinet',
    phase: 1,
    href: to.today(DEMO_ORG_ID),
    status: 'ready',
    variants: [
      { label: 'один объект', query: 'objects=1' },
      { label: 'много объектов', query: 'objects=many' },
      { label: 'управляющий', query: 'role=manager' },
      ...STATES,
    ],
  },
  {
    id: 'employee-tasks',
    title: 'Мои задачи сотрудника',
    contour: 'employee',
    phase: 1,
    href: to.tasks(DEMO_ORG_ID),
    status: 'planned',
    variants: [{ label: 'сотрудник', query: 'role=employee' }],
  },
]
