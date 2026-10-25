import { useLocalSearchParams } from 'expo-router';

import { useWorkoutSummary } from '@sportbot/api/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { SummaryView } from './components/SummaryView';

const SummaryPage = () => {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const summary = useWorkoutSummary(Number(workoutId));
  return <QueryScreen query={summary}>{(data) => <SummaryView summary={data} />}</QueryScreen>;
};

export default SummaryPage;
