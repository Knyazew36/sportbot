import { useTonnageWeeks } from '@sportbot/api/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { WORKOUT_FORMS } from '@/shared/lib/plural-forms'
import { pluralize } from '@front-cmdt/utils/pluralize'

import { PERIOD_TEXT, type Period } from './periods'
import { TrendSection } from './TrendSection'

const WEEKS: Record<Period, number> = { month: 5, quarter: 13, year: 52 }

// Сколько поднято за период: итог крупно, ниже — по неделям. userId — статистика друга
export const TonnageSection = ({ period, userId }: { period: Period; userId?: number }) => {
  const weeks = useTonnageWeeks(WEEKS[period], userId)
  const list = weeks.data ?? []
  const total = list.reduce((sum, w) => sum + w.tonnage, 0)
  const workouts = list.reduce((sum, w) => sum + w.workouts, 0)
  const data = list.map(w => ({
    label: `с ${formatDate(w.weekStart, 'd MMM')}`,
    title: `неделя с ${formatDate(w.weekStart, 'd MMM')} · ${w.tonnage.toLocaleString('ru-RU')} кг`,
    value: w.tonnage,
  }))

  // Не тренировались с весом — блока нет, нулевой график ни о чём не говорит
  if (!total) return null

  return (
    <TrendSection
      title='Поднято'
      aside={PERIOD_TEXT[period]}
      note='Вес × повторы по всем подходам. График — по неделям.'
      unit='кг'
      headline={total.toLocaleString('ru-RU')}
      caption={`за ${pluralize(workouts, WORKOUT_FORMS)}`}
      data={data}
      curve='step'
      hint='нажми на неделю'
      empty='Пока мало недель для графика.'
    />
  )
}
