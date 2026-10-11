import { useSearchParams } from 'react-router'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DemoRole = 'owner' | 'manager' | 'employee'
export type DemoObjects = '1' | 'many'
export type DemoScreenState = 'ok' | 'empty' | 'error' | 'denied' | 'loading'

export const DEMO_ROLES: { value: DemoRole; label: string }[] = [
  { value: 'owner', label: 'Владелец' },
  { value: 'manager', label: 'Управляющий' },
  { value: 'employee', label: 'Сотрудник' },
]

export const DEMO_OBJECTS: { value: DemoObjects; label: string }[] = [
  { value: '1', label: 'Один объект' },
  { value: 'many', label: 'Несколько' },
]

export const DEMO_STATES: { value: DemoScreenState; label: string }[] = [
  { value: 'ok', label: 'Данные' },
  { value: 'empty', label: 'Пусто' },
  { value: 'error', label: 'Ошибка' },
  { value: 'denied', label: 'Нет прав' },
  { value: 'loading', label: 'Загрузка' },
]

type DemoStore = {
  role: DemoRole
  objects: DemoObjects
  setRole: (role: DemoRole) => void
  setObjects: (objects: DemoObjects) => void
}

// Роль и число объектов живут дольше одного экрана: без стора переход по ссылке сбрасывал бы вариант макета
export const useDemoStore = create<DemoStore>()(
  persist(
    (set) => ({
      role: 'owner',
      objects: 'many',
      setRole: (role) => set({ role }),
      setObjects: (objects) => set({ objects }),
    }),
    { name: 'rentybot-demo' },
  ),
)

const pick = <T extends string>(value: string | null, allowed: readonly { value: T }[]): T | null =>
  allowed.some((item) => item.value === value) ? (value as T) : null

// Query-параметр важнее стора: ссылка из /pages открывает ровно тот вариант, на который указывает
export const useDemoState = () => {
  const [params] = useSearchParams()
  const store = useDemoStore()

  const role = pick(params.get('role'), DEMO_ROLES) ?? store.role
  const objects = pick(params.get('objects'), DEMO_OBJECTS) ?? store.objects
  // Состояние экрана — свойство конкретной страницы, поэтому только из URL
  const state = pick(params.get('state'), DEMO_STATES) ?? 'ok'

  return {
    role,
    objects,
    state,
    isEmployee: role === 'employee',
    isOwner: role === 'owner',
    // Деньги видят владелец и управляющий; сотрудник — нет (§4.1 «денежная информация — по правам»)
    canSeeMoney: role !== 'employee',
    singleObject: objects === '1',
  }
}

export type DemoState = ReturnType<typeof useDemoState>
