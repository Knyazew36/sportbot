import { useLocalSearchParams } from 'expo-router';

import { useCooldown } from '@/shared/local/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { OfferView } from './components/OfferView';

const WorkoutFinishedPage = () => {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const cooldown = useCooldown(Number(workoutId));
  return <QueryScreen query={cooldown}>{(data) => <OfferView cooldown={data} />}</QueryScreen>;
};

export default WorkoutFinishedPage;
