import { useSearchParams } from 'react-router'

export const TABS = [
  { value: 'progress', label: 'Прогресс' },
  { value: 'muscles', label: 'Мышцы' },
  { value: 'attendance', label: 'Посещения' },
] as const

type Tab = (typeof TABS)[number]['value']

/** Вкладка из адреса (?tab=): на неё ведут ссылки с «Сегодня», и она переживает возврат со страницы упражнения */
export const useTab = () => {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = TABS.find(t => t.value === raw)?.value ?? 'progress'
  const setTab = (next: Tab) =>
    setParams(
      prev => {
        prev.set('tab', next)
        return prev
      },
      { replace: true },
    )
  return [tab, setTab] as const
}
