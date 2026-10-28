import { router, useLocalSearchParams } from 'expo-router';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useStatsDay } from '@/shared/local/entities/stats';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { List, ListLinkRow } from '@/shared/ui/kit/ListRow';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';

const StatsDayPage = () => {
  const { date } = useLocalSearchParams<{ date: string }>();
  const month = date.slice(0, 7);
  const day = useStatsDay(date);

  return (
    <Screen
      header={
        <TopBar
          back={() => router.dismissTo(routeHref(ROUTES.STATS, { tab: 'attendance', month }))}
          title={formatDate(date, 'd MMMM')}
          subtitle={formatDate(date, 'EEEE')}
        />
      }
      className="gap-6 pb-10"
    >
      <QueryState
        query={day}
        isEmpty={(data) => !data.workouts.length}
        empty={{ title: 'Тренировок нет', description: 'В этот день тренировок не было.' }}
      >
        {(data) => (
          <ScreenSection title="Тренировки" aside={data.workouts.length}>
            <List>
              {data.workouts.map((workout) => (
                <ListLinkRow
                  key={workout.id}
                  onPress={() => router.push(routeHref(ROUTES.STATS_WORKOUT, { workoutId: workout.id, day: date }))}
                  title={workout.complexName}
                  meta={[
                    formatDate(workout.startedAt, 'HH:mm'),
                    pluralize(workout.exercises.length, EXERCISE_FORMS),
                    workout.unplanned && 'внеплановая',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))}
            </List>
          </ScreenSection>
        )}
      </QueryState>
    </Screen>
  );
};

export default StatsDayPage;
