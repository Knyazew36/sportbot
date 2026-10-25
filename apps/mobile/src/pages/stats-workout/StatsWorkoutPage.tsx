import { router, useLocalSearchParams } from 'expo-router';

import { useWorkout, useWorkoutSummary } from '@sportbot/api/entities/workout';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Lead, Poster } from '@/shared/ui/kit/Typography';
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords';
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming';
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol';

import { WorkoutFacts } from './components/WorkoutFacts';
import { WorkoutStatsFooter } from './components/WorkoutStatsFooter';

const StatsWorkoutPage = () => {
  const params = useLocalSearchParams<{ workoutId: string; month?: string; day?: string }>();
  const workoutId = Number(params.workoutId);
  const summary = useWorkoutSummary(workoutId);
  const workout = useWorkout(workoutId);
  const back = params.day
    ? routeHref(ROUTES.STATS_DAY, { date: params.day })
    : routeHref(ROUTES.STATS, { tab: 'attendance', month: params.month });

  return (
    <Screen
      header={
        <TopBar
          back={() => router.dismissTo(back)}
          title={summary.data?.complexName ?? 'Тренировка'}
          subtitle={workout.data ? formatDate(workout.data.date, 'EEEE, d MMMM') : undefined}
        />
      }
      footer={summary.data && <WorkoutStatsFooter workoutId={workoutId} back={back} />}
      className="gap-8 pb-10"
    >
      <QueryState query={summary}>
        {(data) => (
          <>
            <Rise className="px-gutter">
              <Lead>тренировка</Lead>
              <Poster size="3xl" tone="primary" fit>
                {workout.data ? formatDate(workout.data.date, 'd MMMM') : data.complexName}
              </Poster>
            </Rise>
            <WorkoutFacts
              summary={data}
              editTo={routeHref(ROUTES.WORKOUT_EDIT, { workoutId, day: params.day, month: params.month })}
            />
            {data.records.length > 0 && (
              <ScreenSection title="Рекорды" aside={data.records.length}>
                <WorkoutRecords records={data.records} />
              </ScreenSection>
            )}
            {data.timing && <SummaryTiming timing={data.timing} />}
            <WorkoutProtocol workoutId={workoutId} />
          </>
        )}
      </QueryState>
    </Screen>
  );
};

export default StatsWorkoutPage;
