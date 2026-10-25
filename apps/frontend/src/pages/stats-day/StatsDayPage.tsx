import { pluralize } from '@front-cmdt/utils/pluralize'
import { useParams } from 'react-router'

import { useStatsDay } from '@sportbot/api/entities/stats'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { List, ListLinkRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'

// Разводящая дня: в один день было несколько тренировок — выбираем, какую открыть.
// С одной тренировкой календарь ведёт сразу на неё, сюда не попадает
const StatsDayPage = () => {
  const date = useParams().date!
  const month = date.slice(0, 7)
  const day = useStatsDay(date)

  return (
    <Screen
      header={
        <TopBar
          back={`${ROUTES.STATS}?tab=attendance&month=${month}`}
          title={formatDate(date, 'd MMMM')}
          subtitle={formatDate(date, 'EEEE')}
        />
      }
      className='gap-6 pb-10'
    >
      <QueryScreen
        query={day}
        isEmpty={d => !d.workouts.length}
        empty={{ title: 'Тренировок нет', description: 'В этот день тренировок не было.' }}
      >
        {d => (
          <ScreenSection
            title='Тренировки'
            aside={d.workouts.length}
          >
            <List>
              {d.workouts.map(w => (
                <ListLinkRow
                  key={w.id}
                  to={`${buildPath(ROUTES.STATS_WORKOUT, { workoutId: w.id })}?day=${date}`}
                  title={w.complexName}
                  // Время начала — иначе одноимённые тренировки одного дня не отличить
                  meta={[formatDate(w.startedAt, 'HH:mm'), pluralize(w.exercises.length, EXERCISE_FORMS), w.unplanned && 'внеплановая']
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))}
            </List>
          </ScreenSection>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StatsDayPage
