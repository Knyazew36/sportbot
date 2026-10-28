import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useMuscleLoad, useProgressList } from '@/shared/local/entities/stats';

import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value';
import { CHIP_ALL, ChipFilter } from '@/shared/ui/kit/ChipFilter';
import { List } from '@/shared/ui/kit/ListRow';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { SearchField } from '@/shared/ui/kit/SearchField';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { exerciseStatsLink, statsHome } from '@/widgets/stats/links';
import { PeriodBar } from '@/widgets/stats/PeriodBar';
import { PERIOD_DAYS, usePeriod } from '@/widgets/stats/periods';
import { ProgressRow } from '@/widgets/stats/ProgressRow';

const STATUSES = [
  { value: 'growing', label: 'Растут' },
  { value: 'stalled', label: 'Стоят' },
] as const;

type Status = (typeof STATUSES)[number]['value'] | typeof CHIP_ALL;

const StatsExercisesPage = () => {
  const params = useLocalSearchParams<{ userId?: string; muscle?: string }>();
  const userId = Number(params.userId) || undefined;
  const muscleId = Number(params.muscle) || undefined;
  const [period] = usePeriod();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>(CHIP_ALL);
  const query = useDebouncedValue(search.trim());
  const muscles = useMuscleLoad(4, userId);
  const list = useProgressList(
    {
      days: PERIOD_DAYS[period],
      filter_muscle: muscleId,
      filter_status: status === CHIP_ALL ? undefined : status,
      search: query || undefined,
    },
    userId,
  );

  const setMuscle = (value: string) => router.setParams({ muscle: value === CHIP_ALL ? undefined : value });

  return (
    <Screen
      header={
        <TopBar
          back={() => router.dismissTo(statsHome(userId, period, muscleId ? 'muscles' : undefined))}
          title="Упражнения"
          subtitle="прогресс за период"
        />
      }
      className="gap-5 pb-10"
    >
      <PeriodBar />
      <View className="px-gutter gap-3">
        <SearchField value={search} onValueChange={setSearch} />
        <Segmented options={STATUSES} value={status} onValueChange={setStatus} emptyValue={CHIP_ALL} />
        <ChipFilter
          options={(muscles.data ?? []).map((muscle) => ({ value: String(muscle.muscleId), label: muscle.name }))}
          value={muscleId ? String(muscleId) : CHIP_ALL}
          onValueChange={setMuscle}
        />
      </View>
      <QueryState
        query={list}
        isEmpty={(data) => !data.length}
        empty={{
          title: 'Ничего не нашлось',
          description: 'Прогресс появится, когда на тренировке будут записаны подходы.',
        }}
      >
        {(data) => (
          <List className="mx-gutter">
            {data.map((item) => (
              <ProgressRow key={item.id} item={item} to={exerciseStatsLink(item.id, { userId, period })} />
            ))}
          </List>
        )}
      </QueryState>
    </Screen>
  );
};

export default StatsExercisesPage;
