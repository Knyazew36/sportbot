import type { CatalogScope } from '@sportbot/api/entities/program'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow } from '@/shared/ui/kit/Typography'

import type { CatalogFilter, CatalogSort } from '../model/use-catalog-filter'

const SCOPE_OPTIONS: { value: CatalogScope; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'templates', label: 'Каталог' },
  { value: 'users', label: 'Пользователей' },
]

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'default', label: 'Рекомендуем' },
  { value: 'popular', label: 'Популярные' },
]

// «Ещё» в фильтре каталога: чьи программы и порядок
export const CatalogMoreFilters = ({ filter }: { filter: CatalogFilter }) => (
  <>
    <div className='flex flex-col gap-1.5'>
      <Eyebrow as='p'>Чьи</Eyebrow>
      <Segmented
        options={SCOPE_OPTIONS}
        value={filter.scope}
        onValueChange={filter.setScope}
        stretch
      />
    </div>
    <div className='flex flex-col gap-1.5'>
      <Eyebrow as='p'>Сначала</Eyebrow>
      <Segmented
        options={SORT_OPTIONS}
        value={filter.sort}
        onValueChange={filter.setSort}
        stretch
      />
    </div>
  </>
)
