import { useLocalSearchParams } from 'expo-router';

import { useCooldown } from '@/shared/local/entities/workout';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';

import { CooldownView } from './components/CooldownView';

const CooldownPage = () => {
  const { workoutId, start } = useLocalSearchParams<{ workoutId: string; start?: string }>();
  const cooldown = useCooldown(Number(workoutId));
  return (
    <QueryScreen query={cooldown} fullscreen>
      {(data) => <CooldownView cooldown={data} start={start === '1'} />}
    </QueryScreen>
  );
};

export default CooldownPage;
