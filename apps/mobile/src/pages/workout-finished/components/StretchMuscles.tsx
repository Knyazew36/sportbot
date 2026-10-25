import { View } from 'react-native';

import type { CooldownStretchResponseDto } from '@sportbot/api/generated/model';
import { Badge } from '@/shared/ui/kit/Badge';

export const StretchMuscles = ({ stretches }: { stretches: CooldownStretchResponseDto[] }) => {
  const muscles = Array.from(new Set(stretches.flatMap((s) => s.muscles.split(', ').map((m) => m.trim())))).filter(Boolean);
  if (!muscles.length) return null;
  return (
    <View className="mt-4 flex-row flex-wrap gap-1.5">
      {muscles.map((m) => (
        <Badge key={m} variant="outline">
          {m}
        </Badge>
      ))}
    </View>
  );
};
