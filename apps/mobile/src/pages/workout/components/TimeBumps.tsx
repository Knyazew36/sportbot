import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Poster } from '@/shared/ui/kit/Typography';

export const useTimeBumps = () => {
  const [bumps, setBumps] = useState<number[]>([]);
  const bumpId = useRef(0);
  return {
    bumps,
    bump: () => {
      bumpId.current += 1;
      const id = bumpId.current;
      setBumps((list) => [...list, id]);
      setTimeout(() => setBumps((list) => list.filter((item) => item !== id)), 1100);
    },
  };
};

type TimeBumpsProps = ReturnType<typeof useTimeBumps> & { label: string };

export const TimeBumps = ({ bumps, label }: TimeBumpsProps) => (
  <View className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2">
    {bumps.map((id) => (
      <View key={id} className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <Poster size="lg" tone="primary" numeric>
          {label}
        </Poster>
      </View>
    ))}
  </View>
);
