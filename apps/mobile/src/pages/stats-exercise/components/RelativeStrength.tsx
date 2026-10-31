import { View } from 'react-native';

import { relativeStrength } from '@sportbot/api/lib/strength';
import { useBodyWeightStats } from '@/shared/local/entities/stats';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

/** Вес тела за год: последняя запись нужна, даже если взвешивались давно */
const WEIGHT_DAYS = 365;

const ratioText = (ratio: number) => ratio.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

// Порт pages/stats-exercise/components/RelativeStrength.tsx. Метка и значение — соседи в View, а не вложенные
// Text: во вложенном Android берёт межстрочный строки и срезает выносные Oswald. Вес тела приватный — у друга блока нет
export const RelativeStrength = ({ e1rm }: { e1rm: number }) => {
  const weights = useBodyWeightStats(WEIGHT_DAYS);
  const bodyWeight = weights.data?.at(-1)?.value;
  const ratio = relativeStrength(e1rm, bodyWeight);
  if (ratio == null || bodyWeight == null) return null;

  return (
    <View className="mt-3 flex-row flex-wrap items-baseline gap-1.5">
      <Eyebrow>Относительно веса тела</Eyebrow>
      <Poster size="sm" tone="primary" className="leading-[30px]">
        {`×${ratioText(ratio)}`}
      </Poster>
      <Text size="sm" tone="muted">
        {`— при ${ratioText(bodyWeight)} кг`}
      </Text>
    </View>
  );
};
