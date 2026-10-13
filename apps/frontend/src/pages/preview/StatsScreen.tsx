import { useState } from 'react'

import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { MARK_LABEL } from '@/widgets/stats/marks'
import { MonthCalendar } from '@/widgets/stats/MonthCalendar'
import { MuscleLoad } from '@/widgets/stats/MuscleLoad'
import { Attendance, StreakPanel } from '@/widgets/stats/StreakPanel'
import { WeightProgress } from '@/widgets/stats/WeightProgress'

import { calendar, stats } from './model/mock'

const STATS_EXERCISES = [
  { value: 'bench', label: 'Жим штанги лёжа' },
  { value: 'squat', label: 'Приседания со штангой' },
  { value: 'pullup', label: 'Подтягивания' },
]

const weightData = stats.weightProgress.map(p => ({ label: p.date, value: p.value }))

// Детали выбранного дня: в превью для всех дней показан один и тот же пример
const DayDetails = ({ day }: { day: number }) => (
  <div className='border-foreground/80 mt-2 border-[1.5px] p-4'>
    <div className='flex items-baseline justify-between'>
      <Poster size='lg'>{day} октября</Poster>
      <Eyebrow tone='primary'>{MARK_LABEL[calendar[day - 1]?.mark ?? 'rest']}</Eyebrow>
    </div>
    <Text
      size='sm'
      tone='muted'
      className='mt-1 mb-3'
    >
      Спина и бицепс · 52 мин
    </Text>
    <List>
      {[
        ['Подтягивания', '12, 10, 9, 8'],
        ['Тяга штанги в наклоне', '50 × 10, 10, 9'],
        ['Тяга верхнего блока', '45 × 12, 12, 10'],
        ['Подъём штанги на бицепс', '25 × 12, 10, 8'],
      ].map(([name, sets]) => (
        <ListRow
          key={name}
          title={
            <Text
              as='span'
              size='sm'
            >
              {name}
            </Text>
          }
          trail={
            <Poster
              as='span'
              size='xs'
              tone='soft'
              className='whitespace-nowrap'
            >
              {sets}
            </Poster>
          }
          className='py-2'
        />
      ))}
    </List>
  </div>
)

const StatsScreen = () => {
  const [selected, setSelected] = useState(12)

  return (
    <Screen
      header={
        <ScreenHeader
          title='Статистика'
          aside='октябрь 2026'
        />
      }
      className='gap-10 pb-10'
    >
      <Attendance
        month={stats.attendance.month}
        week={stats.attendance.week}
        weekNote='2 из 3'
      />
      <StreakPanel
        current={stats.streak.current}
        record={stats.streak.record}
      />
      <WeightProgress
        exercises={STATS_EXERCISES}
        data={weightData}
      />
      <MuscleLoad items={stats.muscles} />
      {/* 1 октября 2026 — четверг: три пустые клетки */}
      <MonthCalendar
        month='Октябрь'
        lead={3}
        days={calendar}
        selected={selected}
        onSelect={setSelected}
      >
        <DayDetails day={selected} />
      </MonthCalendar>
    </Screen>
  )
}

export default StatsScreen
