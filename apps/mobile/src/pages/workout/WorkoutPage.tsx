import { useEffect, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';

import { useCurrentWorkout, useFinishSucceeded } from '@sportbot/api/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';
import { ROUTES } from '@/shared/config/routes';

import { StartWorkout } from './components/StartWorkout';
import { WorkoutView } from './components/WorkoutView';

const WorkoutPage = () => {
  const { complexId: complexIdParam, start: startParam } = useLocalSearchParams<{ complexId?: string; start?: string }>();
  const complexId = complexIdParam ? Number(complexIdParam) : undefined;
  const current = useCurrentWorkout();
  const hasWorkout = Boolean(current.data?.workout);
  const wantsStart = complexIdParam !== undefined || startParam !== undefined;
  const workoutId = current.data?.workout?.id;
  const [shownId, setShownId] = useState<number | undefined>(workoutId);
  if (workoutId && workoutId !== shownId) setShownId(workoutId);
  const finished = useFinishSucceeded(shownId);

  useEffect(() => {
    if (hasWorkout && wantsStart) {
      router.setParams({ complexId: undefined, start: undefined });
    }
  }, [hasWorkout, wantsStart]);

  return (
    <QueryScreen query={current} fullscreen>
      {({ workout }) => {
        if (workout) return <WorkoutView workout={workout} />;
        if (finished && shownId) {
          router.replace({ pathname: ROUTES.WORKOUT_FINISHED, params: { workoutId: String(shownId) } } as never as Href);
          return null;
        }
        if (!complexIdParam && !startParam) {
          router.replace(ROUTES.TODAY);
          return null;
        }
        return <StartWorkout complexId={complexId} />;
      }}
    </QueryScreen>
  );
};

export default WorkoutPage;
