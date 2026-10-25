import { useLocalSearchParams } from 'expo-router';

import { useWorkout } from '@sportbot/api/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { WorkoutEditView } from './components/WorkoutEditView';

const WorkoutEditPage = () => {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const workout = useWorkout(Number(workoutId));
  return (
    <QueryScreen query={workout} fullscreen>
      {(data) => <WorkoutEditView saved={data} />}
    </QueryScreen>
  );
};

export default WorkoutEditPage;
