import { useState } from 'react';
import { View } from 'react-native';

import { useBodyWeightStats } from '@/shared/local/entities/stats';

import { formatDate } from '@/shared/lib/format';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { StepChart } from '@/shared/ui/kit/StepChart';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { PERIOD_DAYS, PERIOD_TEXT, PERIODS, type Period } from '@/widgets/stats/periods';

import { weightChange } from '../model/body-weight';

// График веса тела рядом с его записью: это про тело, а не про тренировки, поэтому в профиле, а не в статистике
export const BodyWeightChart = () => {
  const [period, setPeriod] = useState<Period>('quarter');
  const weights = useBodyWeightStats(PERIOD_DAYS[period]);
  const points = weights.data ?? [];
  const change = weightChange(points);

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Eyebrow>{change == null ? 'изменение' : `${change} кг ${PERIOD_TEXT[period]}`}</Eyebrow>
        <Segmented options={PERIODS} value={period} onValueChange={setPeriod} />
      </View>
      {points.length > 1 ? (
        <StepChart
          data={points.map((p) => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))}
          unit="кг"
          curve="line"
          className="-mx-2"
        />
      ) : (
        <Text size="sm" tone="muted">
          Для графика нужно хотя бы две записи веса за период.
        </Text>
      )}
    </View>
  );
};
