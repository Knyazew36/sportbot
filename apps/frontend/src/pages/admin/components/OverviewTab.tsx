import { useState } from 'react'

import { type AdminStats, useAdminStats } from '@sportbot/api/entities/admin'
import { formatDate } from '@/shared/lib/format'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow } from '@/shared/ui/kit/Typography'

type Metric = 'activeUsers' | 'newUsers' | 'workouts'

const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: 'activeUsers', label: 'Активные', unit: 'чел.' },
  { value: 'newUsers', label: 'Новые', unit: 'чел.' },
  { value: 'workouts', label: 'Тренировки', unit: 'трен.' },
]

const DayChart = ({ days }: { days: AdminStats['days'] }) => {
  const [metric, setMetric] = useState<Metric>('activeUsers')
  const unit = METRICS.find(m => m.value === metric)?.unit ?? ''

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Eyebrow tone='primary'>по дням · 30 дней</Eyebrow>
        <Segmented
          options={METRICS}
          value={metric}
          onValueChange={setMetric}
        />
      </div>
      <StepChart
        key={metric}
        data={days.map(d => ({
          label: formatDate(d.date, 'd MMM'),
          title: formatDate(d.date, 'd MMMM'),
          value: d[metric],
        }))}
        unit={unit}
        curve='line'
        className='-mx-2'
      />
    </div>
  )
}

// Обзор: сколько людей пришло и сколько из них тренируется. Активный — начал тренировку в боте или приложении
export const OverviewTab = () => {
  const stats = useAdminStats()

  return (
    <QueryScreen query={stats}>
      {s => (
        <Rise className='px-gutter flex flex-col gap-6'>
          <div className='flex flex-col gap-2'>
            <Eyebrow tone='primary'>пользователи</Eyebrow>
            <StatGrid
              framed
              items={[
                { label: 'всего', value: s.usersTotal },
                { label: 'прошли настройку', value: s.usersOnboarded },
              ]}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Eyebrow tone='primary'>новые</Eyebrow>
            <StatGrid
              items={[
                { label: '7 дней', value: s.usersNew7 },
                { label: '30 дней', value: s.usersNew30 },
              ]}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Eyebrow tone='primary'>тренировались</Eyebrow>
            <StatGrid
              items={[
                { label: 'сегодня', value: s.activeToday },
                { label: '7 дней', value: s.active7 },
                { label: '30 дней', value: s.active30 },
              ]}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Eyebrow tone='primary'>тренировок завершено</Eyebrow>
            <StatGrid
              items={[
                { label: '7 дней', value: s.workouts7 },
                { label: '30 дней', value: s.workouts30 },
                { label: 'всего', value: s.workoutsTotal },
              ]}
            />
          </div>
          <DayChart days={s.days} />
        </Rise>
      )}
    </QueryScreen>
  )
}
