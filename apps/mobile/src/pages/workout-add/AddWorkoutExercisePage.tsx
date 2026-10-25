import { Redirect } from 'expo-router';

import { useCurrentWorkout } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { AddView } from './components/AddView';

const AddWorkoutExercisePage = () => {
  const current = useCurrentWorkout();
  return (
    <QueryScreen query={current} fullscreen>
      {({ workout }) => (workout ? <AddView workout={workout} /> : <Redirect href={ROUTES.TODAY} />)}
    </QueryScreen>
  );
};

export default AddWorkoutExercisePage;
