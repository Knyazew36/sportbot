import { type ProgressUnit, sessionRestsText, sessionSetText, useProgressSessions } from '@sportbot/api/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

type ExerciseSessionsProps = { exerciseId: number; unit: ProgressUnit; userId?: number }

// История тренировок с упражнением: все подходы, лучший выделен, у рекорда — подпись, под подходами — отдых.
// Порциями, новые сверху. Общая для статистики упражнения и шторки «Прошлый раз» на тренировке
export const ExerciseSessions = ({ exerciseId, unit, userId }: ExerciseSessionsProps) => {
  const sessions = useProgressSessions(exerciseId, userId)

  return (
    <>
      <QueryScreen
        query={sessions}
        className=''
      >
        {d => (
          <List>
            {d.pages
              .flatMap(p => p.items ?? [])
              .map(s => {
                const rests = sessionRestsText(s.sets)
                return (
                  <ListRow
                    key={s.id}
                    title={formatDate(s.date, 'd MMMM')}
                    trail={
                      s.isRecord && (
                        <Eyebrow
                          size='sm'
                          tone='primary'
                        >
                          рекорд
                        </Eyebrow>
                      )
                    }
                  >
                    <Text
                      as='div'
                      size='sm'
                      tone='muted'
                      className='mt-1 flex flex-wrap gap-x-3'
                    >
                      {s.sets.map((set, i) => (
                        <span
                          key={i}
                          className={cn(i === s.bestIndex && 'text-foreground font-semibold')}
                        >
                          {sessionSetText(set, unit)}
                        </span>
                      ))}
                    </Text>
                    {rests && (
                      <Text
                        size='xs'
                        tone='muted'
                        className='mt-1 tabular-nums'
                      >
                        {rests}
                      </Text>
                    )}
                  </ListRow>
                )
              })}
          </List>
        )}
      </QueryScreen>
      <LoadMore query={sessions} />
    </>
  )
}
