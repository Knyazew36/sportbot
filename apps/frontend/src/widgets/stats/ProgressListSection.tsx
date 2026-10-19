import { useProgressList } from '@/entities/stats'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List } from '@/shared/ui/kit/ListRow'
import { Text } from '@/shared/ui/kit/Typography'

import { exerciseStatsLink, statsLink } from './links'
import { PERIOD_DAYS, PERIOD_TEXT, type Period } from './periods'
import { ProgressRow } from './ProgressRow'
import { StatsSection } from './StatsSection'

const TOP = 6

// Прогресс по упражнениям, которые делались чаще всего за период; остальные — на странице «Все».
// Подходов нет (простой учёт) — вместо списка подсказка, откуда берётся прогресс. userId — статистика друга
export const ProgressListSection = ({ period, userId }: { period: Period; userId?: number }) => {
  const list = useProgressList({ days: PERIOD_DAYS[period], limit: TOP }, userId)

  if (!list.data) return null

  return (
    <StatsSection
      title='Прогресс'
      aside={PERIOD_TEXT[period]}
      note='Лучший подход тренировки: больше вес, а при том же весе — больше повторов. Справа — насколько он вырос за период.'
    >
      {!list.data.length && (
        <Text
          size='sm'
          tone='muted'
        >
          Прогресс появится, когда на тренировке будут записаны подходы: вес и повторы.
        </Text>
      )}
      <List>
        {list.data.map(item => (
          <ProgressRow
            key={item.id}
            item={item}
            to={exerciseStatsLink(item.id, { userId, period })}
          />
        ))}
      </List>
      {list.data.length > 0 && (
      <ButtonLink
        to={statsLink(ROUTES.STATS_EXERCISES, { userId, period })}
        variant='outline'
        className='w-full'
      >
        Все упражнения
      </ButtonLink>
      )}
    </StatsSection>
  )
}
