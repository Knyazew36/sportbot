import { pluralize } from '@front-cmdt/utils/pluralize'

import type { AdminUserDetail } from '@/entities/admin'
import { formatDate } from '@/shared/lib/format'
import { SET_FORMS } from '@/shared/lib/plural-forms'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Text } from '@/shared/ui/kit/Typography'

type Workout = AdminUserDetail['recentWorkouts'][number]

const STATUS: Record<Workout['status'], string> = {
  IN_PROGRESS: 'идёт',
  FINISHED: 'завершена',
  AUTO_CLOSED: 'закрыл бот',
}

const details = (w: Workout) =>
  [
    STATUS[w.status],
    w.mode === 'DETAILED' ? pluralize(w.sets, SET_FORMS) : 'без подходов',
    w.unplanned && 'вне плана',
  ]
    .filter(Boolean)
    .join(' · ')

// Последние тренировки: что делал и доводит ли до конца
export const UserWorkouts = ({ workouts }: { workouts: Workout[] }) =>
  workouts.length ? (
    <List>
      {workouts.map(w => (
        <ListRow
          key={w.id}
          title={w.complexName}
          meta={details(w)}
          trail={
            <Text
              as='span'
              size='sm'
              tone='muted'
            >
              {formatDate(w.date, 'd MMM')}
            </Text>
          }
        />
      ))}
    </List>
  ) : (
    <Text
      size='sm'
      tone='muted'
    >
      Тренировок ещё не было.
    </Text>
  )
