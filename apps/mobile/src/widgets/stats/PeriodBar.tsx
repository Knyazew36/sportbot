import { View } from 'react-native';

import { Segmented } from '@/shared/ui/kit/Segmented';

import { PERIODS, usePeriod } from './periods';

// Один переключатель периода на экран — порт widgets/stats/PeriodBar.tsx: прогресс, посещаемость и вес тела меняются вместе
export const PeriodBar = () => {
  const [period, setPeriod] = usePeriod();

  return (
    <View className="px-gutter">
      <Segmented options={PERIODS} value={period} onValueChange={setPeriod} stretch />
    </View>
  );
};
