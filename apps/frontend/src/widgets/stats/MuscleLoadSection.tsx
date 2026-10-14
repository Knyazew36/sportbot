import { useState } from 'react'

import { useMuscleLoad } from '@/entities/stats'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { Segmented } from '@/shared/ui/kit/Segmented'

import { MuscleLoad } from './MuscleLoad'

const WEEKS = [
  { value: '0', label: 'Эта неделя' },
  { value: '1', label: 'Прошлая' },
]

// Подходы за неделю на мышцу; «забыто» — ноль за две недели (frontend-tz, 12.2). userId — статистика друга
export const MuscleLoadSection = ({ userId }: { userId?: number }) => {
  const [weeksAgo, setWeeksAgo] = useState('0')
  const load = useMuscleLoad(Number(weeksAgo), userId)

  if (!load.data?.length) return null

  return (
    <div className='flex flex-col gap-3'>
      <MuscleLoad
        items={load.data}
        linkTo={m => {
          const path = buildPath(ROUTES.STATS_MUSCLE, { muscleId: m.muscleId! })
          return userId ? `${path}?userId=${userId}` : path
        }}
      />
      <div className='px-gutter'>
        <Segmented
          options={WEEKS}
          value={weeksAgo}
          onValueChange={setWeeksAgo}
          stretch
        />
      </div>
    </div>
  )
}
