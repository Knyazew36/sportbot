import { useSearchParams } from 'react-router'

import { useState } from 'react'

import { useMuscleLoad, useProgressList } from '@/entities/stats'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { ChipFilter, CHIP_ALL } from '@/shared/ui/kit/ChipFilter'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { exerciseStatsLink, statsHome } from '@/widgets/stats/links'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { PERIOD_DAYS, usePeriod } from '@/widgets/stats/periods'
import { ProgressRow } from '@/widgets/stats/ProgressRow'

const STATUSES = [
  { value: 'growing', label: 'Растут' },
  { value: 'stalled', label: 'Стоят' },
] as const

type Status = (typeof STATUSES)[number]['value'] | typeof CHIP_ALL

// Прогресс по всем упражнениям: поиск, «растут / стоят», фильтр мышцы из баланса (?muscle=). userId — статистика друга
const StatsExercisesPage = () => {
  const [params, setParams] = useSearchParams()
  const userId = Number(params.get('userId')) || undefined
  const muscleId = Number(params.get('muscle')) || undefined
  const [period] = usePeriod()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status>(CHIP_ALL)
  const query = useDebouncedValue(search.trim())
  // Названия мышц — из того же запроса, что и баланс на странице статистики: обычно он уже в кэше
  const muscles = useMuscleLoad(4, userId)
  const list = useProgressList(
    {
      days: PERIOD_DAYS[period],
      filter_muscle: muscleId,
      filter_status: status === CHIP_ALL ? undefined : status,
      search: query || undefined,
    },
    userId,
  )

  const setMuscle = (value: string) =>
    setParams(
      prev => {
        if (value === CHIP_ALL) prev.delete('muscle')
        else prev.set('muscle', value)
        return prev
      },
      { replace: true },
    )

  return (
    <Screen
      header={
        <TopBar
          back={statsHome(userId, period)}
          title='Упражнения'
          subtitle='прогресс за период'
        />
      }
      className='gap-5 pb-10'
    >
      <PeriodBar />
      <div className='px-gutter flex flex-col gap-3'>
        <SearchField
          value={search}
          onValueChange={setSearch}
        />
        <Segmented
          options={STATUSES}
          value={status}
          onValueChange={setStatus}
          emptyValue={CHIP_ALL}
        />
        <ChipFilter
          options={(muscles.data ?? []).map(m => ({ value: String(m.muscleId), label: m.name }))}
          value={muscleId ? String(muscleId) : CHIP_ALL}
          onValueChange={setMuscle}
        />
      </div>
      <QueryScreen
        query={list}
        isEmpty={d => !d.length}
        empty={{
          title: 'Ничего не нашлось',
          description: 'Прогресс появится, когда на тренировке будут записаны подходы.',
        }}
      >
        {d => (
          <List className='mx-gutter'>
            {d.map(item => (
              <ProgressRow
                key={item.id}
                item={item}
                to={exerciseStatsLink(item.id, { userId, period })}
              />
            ))}
          </List>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StatsExercisesPage
