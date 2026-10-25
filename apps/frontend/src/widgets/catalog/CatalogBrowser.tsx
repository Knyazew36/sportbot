import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

import type { ReactNode } from 'react'

import {
  type CatalogKind,
  type CatalogListItem,
  type Equipment,
  EQUIPMENT_LABEL,
  useCatalogExercises,
  useCatalogStretches,
  useMuscles,
} from '@sportbot/api/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { List } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { CatalogFilterBar } from './CatalogFilterBar'
import { CatalogRow } from './CatalogRow'

export type CatalogFilterState = {
  query: string
  /** Мышцы — коды: шторка и карта тела работают с ними, API ждёт id */
  muscleCodes: string[]
  /** Только у упражнений */
  equipment: Equipment | 'ALL'
}

export const EMPTY_CATALOG_FILTER: CatalogFilterState = { query: '', muscleCodes: [], equipment: 'ALL' }

/** Подпись строки: мышцы, инвентарь, время удержания растяжки */
export const catalogMeta = (item: CatalogListItem) =>
  [item.muscles, item.equipment && EQUIPMENT_LABEL[item.equipment], item.holdSeconds != null && `${item.holdSeconds} с`]
    .filter(Boolean)
    .join(' · ')

type CatalogBrowserProps = {
  kind: CatalogKind
  filter: CatalogFilterState
  onFilterChange: (patch: Partial<CatalogFilterState>) => void
  /** Строка выдачи. По умолчанию — ссылка из linkTo */
  renderItem?: (item: CatalogListItem) => ReactNode
  /** Куда ведёт строка по умолчанию: карточка упражнения или растяжки */
  linkTo?: (id: number) => string
  /** Под «Сбросить фильтры», если ничего не нашлось: «добавить своё» */
  emptyAction?: ReactNode
}

// Справочник как блок: поиск, чипы мышц и инвентаря со шторками, выдача страницами (frontend-tz, 11.1).
// Один и тот же в /library и в подборе упражнений — отличаются только строкой и тем, где живут фильтры
export const CatalogBrowser = ({
  kind,
  filter,
  onFilterChange,
  renderItem,
  linkTo,
  emptyAction,
}: CatalogBrowserProps) => {
  const muscles = useMuscles()
  const search = useDebouncedValue(filter.query.trim()) || undefined
  const muscleIds = muscles.data?.filter(m => filter.muscleCodes.includes(m.code)).map(m => m.id)
  const filterMuscle = muscleIds?.length ? muscleIds.join(',') : undefined

  const row =
    renderItem ??
    ((item: CatalogListItem) => (
      <CatalogRow
        key={item.id}
        name={item.name}
        imageUrl={toAssetUrl(item.imageUrl) ?? null}
        meta={catalogMeta(item)}
        draft={item.draft}
        to={linkTo?.(item.id)}
      />
    ))

  const empty = (
    <div className='flex w-full flex-col gap-2'>
      <Button
        variant='outline'
        size='sm'
        className='self-start'
        onClick={() => onFilterChange(EMPTY_CATALOG_FILTER)}
      >
        Сбросить фильтры
      </Button>
      {emptyAction}
    </div>
  )

  const results = { renderItem: row, emptyAction: empty }

  return (
    <>
      <Rise className='px-gutter'>
        <CatalogFilterBar
          query={filter.query}
          onQueryChange={query => onFilterChange({ query })}
          muscles={muscles.data ?? []}
          muscleCodes={filter.muscleCodes}
          onMuscleCodesChange={muscleCodes => onFilterChange({ muscleCodes })}
          equipment={kind === 'exercise' ? filter.equipment : undefined}
          onEquipmentChange={equipment => onFilterChange({ equipment })}
          onReset={() => onFilterChange({ muscleCodes: [], equipment: 'ALL' })}
          placeholder={kind === 'exercise' ? 'Название упражнения' : 'Название растяжки'}
        />
      </Rise>
      <Rise className='px-gutter'>
        {kind === 'exercise' ? (
          <ExerciseResults
            search={search}
            filterMuscle={filterMuscle}
            equipment={filter.equipment}
            {...results}
          />
        ) : (
          <StretchResults
            search={search}
            filterMuscle={filterMuscle}
            {...results}
          />
        )}
      </Rise>
    </>
  )
}

type ResultsProps = {
  search?: string
  filterMuscle?: string
  renderItem: (item: CatalogListItem) => ReactNode
  emptyAction: ReactNode
}

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
)

const StretchResults = ({ search, filterMuscle, ...rest }: ResultsProps) => (
  <Results
    query={useCatalogStretches({ search, filter_muscle: filterMuscle })}
    {...rest}
  />
)

type Page = { items?: CatalogListItem[]; meta?: { total?: number } }

const Results = ({
  query,
  renderItem,
  emptyAction,
}: Omit<ResultsProps, 'search' | 'filterMuscle'> & { query: UseInfiniteQueryResult<InfiniteData<Page>> }) => (
  <QueryScreen
    query={query}
    className=''
    isEmpty={data => !data.pages[0]?.items?.length}
    empty={{
      title: 'Ничего не нашлось',
      description: 'Попробуй другое название или сними фильтры. Нет нужного — добавь своё.',
      action: emptyAction,
    }}
  >
    {data => (
      <div className='flex flex-col gap-3'>
        <Eyebrow as='p'>найдено: {data.pages[0]?.meta?.total ?? 0}</Eyebrow>
        <List>{data.pages.flatMap(page => page.items ?? []).map(renderItem)}</List>
        <LoadMore query={query} />
      </div>
    )}
  </QueryScreen>
)
