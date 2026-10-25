import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StepChart } from '@/shared/ui/kit/StepChart';
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography';

import { StatsSection } from './StatsSection';

type TrendSectionProps = {
  title: string;
  aside?: string;
  /** Что показывает график */
  note: string;
  unit: string;
  /** Крупное число над графиком — итог периода */
  headline?: ReactNode;
  /** Подпись под крупным числом: что именно за число */
  caption?: ReactNode;
  data: { label: string; value: number }[];
  curve?: 'step' | 'line';
  empty: string;
};

// Ряд по датам за период экрана — порт widgets/stats/TrendSection.tsx: вес тела, посещаемость по неделям
export const TrendSection = ({
  title,
  aside,
  note,
  unit,
  headline,
  caption,
  data,
  curve = 'line',
  empty,
}: TrendSectionProps) => (
  <StatsSection title={title} aside={aside} note={note}>
    <View>
      <Poster size="3xl" numeric>
        {headline ?? '—'}
        <Unit>{unit}</Unit>
      </Poster>
      {caption ? <Eyebrow className="mt-2">{caption}</Eyebrow> : null}
    </View>
    {data.length > 1 ? (
      <StepChart data={data} unit={unit} curve={curve} className="-mx-2" />
    ) : (
      <Text size="sm" tone="muted">
        {empty}
      </Text>
    )}
  </StatsSection>
);
