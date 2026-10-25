import { type ProgressUnit, setText, useProgressSessions } from '@sportbot/api/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

type SessionsSectionProps = { exerciseId: number; unit: ProgressUnit; userId?: number }

// История тренировок с упражнением: все подходы, лучший выделен, у рекорда — подпись. Порциями, новые сверху
export const SessionsSection = ({ exerciseId, unit, userId }: SessionsSectionProps) => {
  const sessions = useProgressSessions(exerciseId, userId)

  return (
    <ScreenSection
      title='История'
      aside='по тренировкам'
    >
      <QueryScreen
        query={sessions}
        className=''
      >
        {d => (
          <List>
            {d.pages
              .flatMap(p => p.items ?? [])
              .map(s => (
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
                        {setText(
                          // У кардио подход хранится в секундах, а показывается в минутах
                          { ...set, value: unit === 'min' ? Math.round(set.reps / 6) / 10 : set.reps },
                          unit === 'kg' && !set.weight ? 'reps' : unit,
                        )}
                      </span>
                    ))}
                  </Text>
                </ListRow>
              ))}
          </List>
        )}
      </QueryScreen>
      <LoadMore query={sessions} />
    </ScreenSection>
  )
}
