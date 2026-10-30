import { useLocalSearchParams } from 'expo-router';

import { useStretchRoutine } from '@/shared/local/entities/stretch-routine';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { RunStep } from './components/RunStep';

const StretchRoutineRunPage = () => {
  const routine = useStretchRoutine(Number(useLocalSearchParams<{ routineId: string }>().routineId));
  return (
    <QueryScreen query={routine} fullscreen>
      {(data) => <RunStep routine={data} />}
    </QueryScreen>
  );
};

export default StretchRoutineRunPage;
