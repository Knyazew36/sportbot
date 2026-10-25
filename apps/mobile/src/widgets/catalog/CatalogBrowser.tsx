import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  type CatalogKind,
  type CatalogListItem,
  type Equipment,
  useCatalogExercises,
  useCatalogStretches,
  useMuscles,
} from '@sportbot/api/entities/catalog';
import { toAssetUrl } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value';
import { Button } from '@/shared/ui/kit/Button';
import { List } from '@/shared/ui/kit/ListRow';
import { LoadMore } from '@/shared/ui/kit/LoadMore';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { catalogMeta } from './catalog-labels';
import { type CatalogFilterState, EMPTY_CATALOG_FILTER } from './catalog-filter';
import { CatalogFilterBar } from './CatalogFilterBar';
import { CatalogRow } from './CatalogRow';

type CatalogBrowserProps = {
  kind: CatalogKind;
  filter: CatalogFilterState;
  onFilterChange: (patch: Partial<CatalogFilterState>) => void;
  /** Строка выдачи. По умолчанию — переход по onOpen */
  renderItem?: (item: CatalogListItem) => ReactNode;
  /** Тап по строке по умолчанию: карточка упражнения или растяжки */
  onOpen?: (id: number) => void;
  /** Под «Сбросить фильтры», если ничего не нашлось: «добавить своё» */
  emptyAction?: ReactNode;
  /** Фокус в поиске: экран прячет липкий низ, пока открыта клавиатура */
  onSearchFocusChange?: (focused: boolean) => void;
};

// Справочник как блок — порт widgets/catalog/CatalogBrowser.tsx: поиск, чипы мышц и инвентаря со шторками,
// выдача страницами. Один и тот же в справочнике и в подборе упражнений — отличается только строкой
export const CatalogBrowser = ({
  kind,
  filter,
  onFilterChange,
  renderItem,
  onOpen,
  emptyAction,
  onSearchFocusChange,
}: CatalogBrowserProps) => {
  const muscles = useMuscles();
  const search = useDebouncedValue(filter.query.trim()) || undefined;
  const muscleIds = muscles.data?.filter((m) => filter.muscleCodes.includes(m.code)).map((m) => m.id);
  const filterMuscle = muscleIds?.length ? muscleIds.join(',') : undefined;

  const row =
    renderItem ??
    ((item: CatalogListItem) => (
      <CatalogRow
        key={item.id}
        name={item.name}
        imageUrl={toAssetUrl(item.imageUrl) ?? null}
        meta={catalogMeta(item)}
        draft={item.draft}
        onPress={onOpen && (() => onOpen(item.id))}
      />
    ));

  const empty = (
    <View className="w-full gap-2">
      <Button variant="outline" size="sm" onPress={() => onFilterChange(EMPTY_CATALOG_FILTER)}>
        Сбросить фильтры
      </Button>
      {emptyAction}
    </View>
  );

  const results = { renderItem: row, emptyAction: empty };

  return (
    <>
      <Rise className="px-gutter">
        <CatalogFilterBar
          query={filter.query}
          onQueryChange={(query) => onFilterChange({ query })}
          muscles={muscles.data ?? []}
          muscleCodes={filter.muscleCodes}
          onMuscleCodesChange={(muscleCodes) => onFilterChange({ muscleCodes })}
          equipment={kind === 'exercise' ? filter.equipment : undefined}
          onEquipmentChange={(equipment) => onFilterChange({ equipment })}
          onReset={() => onFilterChange({ muscleCodes: [], equipment: 'ALL' })}
          placeholder={kind === 'exercise' ? 'Название упражнения' : 'Название растяжки'}
          onSearchFocus={() => onSearchFocusChange?.(true)}
          onSearchBlur={() => onSearchFocusChange?.(false)}
        />
      </Rise>
      <Rise className="px-gutter" index={1}>
        {kind === 'exercise' ? (
          <ExerciseResults search={search} filterMuscle={filterMuscle} equipment={filter.equipment} {...results} />
        ) : (
          <StretchResults search={search} filterMuscle={filterMuscle} {...results} />
        )}
      </Rise>
    </>
  );
};

type ResultsProps = {
  search?: string;
  filterMuscle?: string;
  renderItem: (item: CatalogListItem) => ReactNode;
  emptyAction: ReactNode;
};

// Запрашиваем только нужный вид: растяжки на экране упражнений не грузим
const ExerciseResults = ({
  search,
  filterMuscle,
  equipment,
  ...rest
}: ResultsProps & { equipment: Equipment | 'ALL' }) => (
  <Results
    query={useCatalogExercises({
      search,
      filter_muscle: filterMuscle,
      filter_equipment: equipment === 'ALL' ? undefined : equipment,
    })}
    {...rest}
  />
);

const StretchResults = ({ search, filterMuscle, ...rest }: ResultsProps) => (
  <Results query={useCatalogStretches({ search, filter_muscle: filterMuscle })} {...rest} />
);

type Page = { items?: CatalogListItem[]; meta?: { total?: number } };

const Results = ({
  query,
  renderItem,
  emptyAction,
}: Omit<ResultsProps, 'search' | 'filterMuscle'> & { query: UseInfiniteQueryResult<InfiniteData<Page>> }) => (
  <QueryState
    query={query}
    isEmpty={(data) => !data.pages[0]?.items?.length}
    empty={{
      title: 'Ничего не нашлось',
      description: 'Попробуй другое название или сними фильтры. Нет нужного — добавь своё.',
      action: emptyAction,
    }}
  >
    {(data) => (
      <View className="gap-3">
        <Eyebrow>найдено: {data.pages[0]?.meta?.total ?? 0}</Eyebrow>
        <List>{data.pages.flatMap((page) => page.items ?? []).map(renderItem)}</List>
        <LoadMore query={query} />
      </View>
    )}
  </QueryState>
);
