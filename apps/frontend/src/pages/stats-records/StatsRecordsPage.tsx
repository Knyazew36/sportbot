import { useSearchParams } from 'react-router'

import { useRecords } from '@/entities/stats'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { exerciseStatsLink, statsHome } from '@/widgets/stats/links'
import { usePeriod } from '@/widgets/stats/periods'
import { RecordRow } from '@/widgets/stats/RecordRow'

// Все личные рекорды, новые сверху: больше вес или столько же, но больше повторов. userId — статистика друга
const StatsRecordsPage = () => {
  const userId = Number(useSearchParams()[0].get('userId')) || undefined
  const [period] = usePeriod()
  const records = useRecords({}, userId)

  return (
    <Screen
      header={
        <TopBar
          back={statsHome(userId, period)}
          title='Рекорды'
          subtitle='личные'
        />
      }
      className='gap-5 pb-10'
    >
      <QueryScreen
        query={records}
        isEmpty={d => !d.length}
        empty={{
          title: 'Рекордов пока нет',
          description: 'Рекорд — когда лучший подход побил все прежние: больше вес или больше повторов на том же весе.',
        }}
      >
        {d => (
          <List className='mx-gutter'>
            {d.map(r => (
              <RecordRow
                key={`${r.exerciseId}-${r.date}`}
                record={r}
                to={exerciseStatsLink(r.exerciseId, { userId, period })}
              />
            ))}
          </List>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StatsRecordsPage
