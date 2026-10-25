import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { PROGRESS_UNIT, useProgress } from '@sportbot/api/entities/stats';
import { durationText } from '@sportbot/api/lib/measure';

import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/Button';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { StepChart } from '@/shared/ui/kit/StepChart';
import { Text } from '@/shared/ui/kit/Typography';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';
import { statsHome } from '@/widgets/stats/links';
import { PeriodBar } from '@/widgets/stats/PeriodBar';
import { PERIOD_DAYS, PERIOD_TEXT, usePeriod } from '@/widgets/stats/periods';

import { E1rmCard } from './components/E1rmCard';
import { E1rmSheet } from './components/E1rmSheet';
import { ProgressHeadline } from './components/ProgressHeadline';
import { SessionsSection } from './components/SessionsSection';
import { bestPerDay } from './model/progress';

const StatsExercisePage = () => {
  const params = useLocalSearchParams<{ exerciseId: string; userId?: string }>();
  const exerciseId = Number(params.exerciseId);
  const userId = Number(params.userId) || undefined;
  const [period] = usePeriod();
  const progress = useProgress(exerciseId, PERIOD_DAYS[period], userId);
  const [e1rmOpen, setE1rmOpen] = useState(false);
  const [techniqueOpen, setTechniqueOpen] = useState(false);

  return (
    <Screen
      header={
        <TopBar
          back={() => router.dismissTo(statsHome(userId, period))}
          title={progress.data?.name ?? 'Упражнение'}
          subtitle="прогресс"
        />
      }
      className="gap-8 pb-10"
    >
      <PeriodBar />
      <QueryState
        query={progress}
        isEmpty={(data) => !data.summary}
        empty={{
          title: 'Пока нечего показать',
          description: 'Прогресс появится после тренировки с записанными подходами.',
        }}
      >
        {(data) => {
          const unit = PROGRESS_UNIT[data.unit].short;
          const e1rm = data.e1rm?.best ?? data.e1rm?.current;
          const e1rmPoints = data.e1rm?.points ?? [];
          const days = bestPerDay(data.points);
          const e1rmTrend = e1rmPoints.length > 1 ? e1rmPoints.at(-1)!.value - e1rmPoints[0]!.value : null;

          return (
            <>
              <ProgressHeadline summary={data.summary!} points={data.points} periodText={PERIOD_TEXT[period]} />
              {e1rm && (
                <View className="px-gutter">
                  <E1rmCard
                    e1rm={e1rm}
                    label={data.e1rm?.best ? `лучший ${PERIOD_TEXT[period]}` : 'по последней тренировке'}
                    trend={e1rmTrend}
                    periodText={PERIOD_TEXT[period]}
                    onOpen={() => setE1rmOpen(true)}
                  />
                </View>
              )}
              <ScreenSection title="График" aside={PROGRESS_UNIT[data.unit].aside}>
                {days.length > 1 ? (
                  <StepChart
                    data={days.map((point) => ({
                      label: formatDate(point.date, 'd MMM'),
                      title: formatDate(point.date, 'd MMMM'),
                      value: point.value,
                    }))}
                    unit={data.unit === 'sec' ? '' : unit}
                    format={data.unit === 'sec' ? durationText : undefined}
                    className="-mx-2"
                  />
                ) : (
                  <Text size="sm" tone="muted">
                    За этот период тренировок мало для графика.
                  </Text>
                )}
              </ScreenSection>
              <SessionsSection exerciseId={exerciseId} unit={data.unit} userId={userId} />
              <View className="px-gutter">
                <Button variant="outline" block onPress={() => setTechniqueOpen(true)}>
                  Техника выполнения
                </Button>
              </View>
              <ExerciseSheet
                exercise={techniqueOpen ? { id: exerciseId, name: data.name } : null}
                onOpenChange={setTechniqueOpen}
              />
              {data.e1rm && (
                <E1rmSheet
                  open={e1rmOpen}
                  onOpenChange={setE1rmOpen}
                  e1rm={data.e1rm}
                  periodText={PERIOD_TEXT[period]}
                />
              )}
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
};

export default StatsExercisePage;
