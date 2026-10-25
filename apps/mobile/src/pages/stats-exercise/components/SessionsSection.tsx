import { View } from 'react-native';

import { type ProgressUnit, setText, useProgressSessions } from '@sportbot/api/entities/stats';

import { formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { LoadMore } from '@/shared/ui/kit/LoadMore';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

type SessionsSectionProps = { exerciseId: number; unit: ProgressUnit; userId?: number };

export const SessionsSection = ({ exerciseId, unit, userId }: SessionsSectionProps) => {
  const sessions = useProgressSessions(exerciseId, userId);

  return (
    <ScreenSection title="История" aside="по тренировкам">
      <QueryState query={sessions}>
        {(data) => (
          <List>
            {data.pages
              .flatMap((page) => page.items ?? [])
              .map((session) => (
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
                      <Text key={index} size="sm" tone="muted" medium={index === session.bestIndex} className={cn(index === session.bestIndex && 'text-foreground')}>
                        {setText(
                          { ...set, value: unit === 'min' ? Math.round(set.reps / 6) / 10 : set.reps },
                          unit === 'kg' && !set.weight ? 'reps' : unit,
                        )}
                      </Text>
                    ))}
                  </View>
                </ListRow>
              ))}
          </List>
        )}
      </QueryState>
      <LoadMore query={sessions} />
    </ScreenSection>
  );
};
