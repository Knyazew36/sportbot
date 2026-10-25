import { View } from 'react-native';

import { deltaText, setText, type StatsProgress, type StatsProgressItem } from '@sportbot/api/entities/stats';

import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

const STATUS: Record<StatsProgressItem['status'], string | null> = {
  growing: null,
  flat: 'без роста',
  stalled: 'стоит 3 недели',
  idle: null,
};

type Point = StatsProgress['points'][number];

const topOf = (points: Point[]) =>
  points.reduce((top, point) =>
    point.weight !== top.weight ? (point.weight > top.weight ? point : top) : point.reps > top.reps ? point : top,
  );

type ProgressHeadlineProps = {
  summary: StatsProgressItem;
  points: Point[];
  periodText: string;
};

export const ProgressHeadline = ({ summary, points, periodText }: ProgressHeadlineProps) => {
  const best = points.length ? topOf(points) : summary.best;
  const delta = deltaText(summary.delta, summary.deltaUnit);
  const status = STATUS[summary.status];

  return (
    <ScreenSection>
      <Eyebrow>{points.length ? `Лучший подход ${periodText}` : 'Лучший подход за всё время'}</Eyebrow>
      <Poster size="3xl" numeric fit>
        {setText(best, summary.unit)}
      </Poster>
      <View>
        {delta ? (
          <Poster size="sm" tone="primary" numeric>
            {delta} {periodText}
          </Poster>
        ) : (
          <Text size="sm" tone="muted">
            {points.length ? `${periodText} ${status ?? 'без роста'}` : `${periodText} не делали`}
          </Text>
        )}
        {delta && status && (
          <Text size="sm" tone="muted">
            {status}
          </Text>
        )}
      </View>
    </ScreenSection>
  );
};
