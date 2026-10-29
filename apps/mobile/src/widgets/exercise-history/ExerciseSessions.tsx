import { View } from 'react-native';

import { type ProgressUnit, sessionRestsText, sessionSetText } from '@sportbot/api/entities/stats';
import { useProgressSessions } from '@/shared/local/entities/stats';

import { formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { LoadMore } from '@/shared/ui/kit/LoadMore';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

type ExerciseSessionsProps = { exerciseId: number; unit: ProgressUnit; userId?: number };

// История тренировок с упражнением — порт widgets/exercise-history/ExerciseSessions.tsx: подходы, лучший,
// рекорд и отдых под подходами. Общая для статистики упражнения и шторки «Прошлый раз» на тренировке
export const ExerciseSessions = ({ exerciseId, unit, userId }: ExerciseSessionsProps) => {
  const sessions = useProgressSessions(exerciseId, userId);

  return (
    <>
      <QueryState query={sessions}>
        {(data) => (
          <List>
            {data.pages
              .flatMap((page) => page.items ?? [])
              .map((session) => {
                const rests = sessionRestsText(session.sets);
                return (
                  <ListRow
                    key={session.id}
                    title={formatDate(session.date, 'd MMMM')}
                    trail={
                      session.isRecord && (
                        <Eyebrow size="sm" tone="primary">
                          рекорд
                        </Eyebrow>
                      )
                    }
                  >
                    <View className="mt-1 flex-row flex-wrap gap-x-3">
                      {session.sets.map((set, index) => (
                        <Text
                          key={index}
                          size="sm"
                          tone="muted"
                          medium={index === session.bestIndex}
                          className={cn(index === session.bestIndex && 'text-foreground')}
                        >
                          {sessionSetText(set, unit)}
                        </Text>
                      ))}
                    </View>
                    {rests ? (
                      <Text size="xs" tone="muted" className="mt-1 tabular-nums">
                        {rests}
                      </Text>
                    ) : null}
                  </ListRow>
                );
              })}
          </List>
        )}
      </QueryState>
      <LoadMore query={sessions} />
    </>
  );
};
