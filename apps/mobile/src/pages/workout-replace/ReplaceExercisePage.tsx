import { useLocalSearchParams } from 'expo-router';

import { useCurrentWorkout } from '@/shared/local/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { ReplaceView } from './components/ReplaceView';

const ReplaceExercisePage = () => {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const current = useCurrentWorkout();
  return (
    <QueryScreen query={current} fullscreen>
      {({ workout }) => <ReplaceView itemId={Number(itemId)} workout={workout} />}
    </QueryScreen>
  );
};

export default ReplaceExercisePage;
