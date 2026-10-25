import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { deltaText, setText, type StatsProgressItem } from '@sportbot/api/entities/stats';

import { ListRow } from '@/shared/ui/kit/ListRow';
import { Sparkline } from '@/shared/ui/kit/Sparkline';
import { Poster } from '@/shared/ui/kit/Typography';

const WEEK_MS = 7 * 86_400_000;

/** Что с упражнением за период: «стоит», «не делали N нед.» или сколько было тренировок */
const statusText = (item: StatsProgressItem) => {
  if (item.status === 'stalled') return 'стоит 3 недели';
  if (item.status === 'idle') {
    const weeks = Math.max(1, Math.floor((Date.now() - new Date(item.lastDate).getTime()) / WEEK_MS));
    return `не делали ${pluralize(weeks, ['неделю', 'недели', 'недель'])}`;
  }
  return pluralize(item.sessions, ['тренировка', 'тренировки', 'тренировок']);
};

type ProgressRowProps = { item: StatsProgressItem; to: Href };

// Упражнение в списке прогресса — порт widgets/stats/ProgressRow.tsx: лучший подход, статус, мини-график
// и рост за период. Строка нажимается целиком
export const ProgressRow = ({ item, to }: ProgressRowProps) => {
  const delta = deltaText(item.delta, item.deltaUnit);

  return (
    <ListRow
      title={item.name}
      meta={`${setText(item.best, item.unit)} · ${statusText(item)}`}
      onPress={() => router.push(to)}
      trail={
        <View className="flex-row items-center gap-3">
          <Sparkline values={item.spark} className="text-primary" />
          <Poster size="sm" tone={delta ? 'primary' : 'faint'} numeric>
            {delta ?? '—'}
          </Poster>
        </View>
      }
    />
  );
};
