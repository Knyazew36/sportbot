import { router, useLocalSearchParams } from 'expo-router';

import { useRecords } from '@/shared/local/entities/stats';

import { List } from '@/shared/ui/kit/ListRow';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { exerciseStatsLink, statsHome } from '@/widgets/stats/links';
import { usePeriod } from '@/widgets/stats/periods';
import { RecordRow } from '@/widgets/stats/RecordRow';

const StatsRecordsPage = () => {
  const { userId: rawUserId } = useLocalSearchParams<{ userId?: string }>();
  const userId = Number(rawUserId) || undefined;
  const [period] = usePeriod();
  const records = useRecords({}, userId);

  return (
    <Screen
      header={<TopBar back={() => router.dismissTo(statsHome(userId, period))} title="Рекорды" subtitle="личные" />}
      className="gap-5 pb-10"
    >
      <QueryState
        query={records}
        isEmpty={(data) => !data.length}
        empty={{
          title: 'Рекордов пока нет',
          description:
            'Рекорд — когда лучший подход побил все прежние: больше вес или больше повторов на том же весе.',
        }}
      >
        {(data) => (
          <List className="mx-gutter">
            {data.map((record) => (
              <RecordRow
                key={`${record.exerciseId}-${record.date}`}
                record={record}
                to={exerciseStatsLink(record.exerciseId, { userId, period })}
              />
            ))}
          </List>
        )}
      </QueryState>
    </Screen>
  );
};

export default StatsRecordsPage;
