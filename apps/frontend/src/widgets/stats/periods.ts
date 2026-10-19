import { useSearchParams } from 'react-router'

// Период статистики один на страницу: от него зависят прогресс, посещаемость и вес тела.
// Живёт в адресе (?period=), чтобы пережить переход на страницу упражнения и обратно
export const PERIODS = [
  { value: 'month', label: '1 мес' },
  { value: 'quarter', label: '3 мес' },
  { value: 'year', label: 'Год' },
] as const
export type Period = (typeof PERIODS)[number]['value']

export const PERIOD_DAYS: Record<Period, number> = { month: 31, quarter: 92, year: 366 }

/** Период словами для подписей: «за месяц», «за 3 месяца», «за год» */
export const PERIOD_TEXT: Record<Period, string> = { month: 'за месяц', quarter: 'за 3 месяца', year: 'за год' }

const DEFAULT_PERIOD: Period = 'quarter'

const isPeriod = (value: string | null): value is Period => PERIODS.some(p => p.value === value)

/** Период из адреса; меняется без новой записи в истории — «Назад» не листает периоды */
export const usePeriod = () => {
  const [params, setParams] = useSearchParams()
  const raw = params.get('period')
  const period = isPeriod(raw) ? raw : DEFAULT_PERIOD
  const setPeriod = (next: Period) =>
    setParams(
      prev => {
        prev.set('period', next)
        return prev
      },
      { replace: true },
    )
  return [period, setPeriod] as const
}
