import type { AdminUserDetail } from '@/entities/admin'
import { formatDate } from '@/shared/lib/format'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Text } from '@/shared/ui/kit/Typography'

// Активность: тренировки по неделям и дисциплина за месяц — тренируется ли человек и бросил ли
export const UserActivity = ({ user }: { user: AdminUserDetail }) => (
  <div className='flex flex-col gap-4'>
    <StatGrid
      items={[
        { label: 'дней сделано', value: user.daysDone },
        { label: 'пропущено', value: user.daysMissed },
        { label: 'пропусков подряд', value: user.missedInRow },
      ]}
    />
    <Text
      size='sm'
      tone='muted'
    >
      Дни плана за 30 дней.{' '}
      {user.lastActiveAt
        ? `Последняя тренировка ${formatDate(user.lastActiveAt, 'd MMMM yyyy, HH:mm')}.`
        : 'Тренировок ещё не было.'}
    </Text>
    <StepChart
      data={user.weeks.map(w => ({
        label: formatDate(w.week, 'd MMM'),
        title: `неделя с ${formatDate(w.week, 'd MMMM')}`,
        value: w.workouts,
      }))}
      unit='трен.'
      curve='line'
      className='-mx-2'
    />
  </div>
)
