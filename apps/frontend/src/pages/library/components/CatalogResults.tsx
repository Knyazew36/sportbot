import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

import type { ReactNode } from 'react'

import { type CatalogListItem, EQUIPMENT_LABEL } from '@/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { List } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

type Page = { items?: CatalogListItem[]; meta?: { total?: number } }

type CatalogResultsProps = {
  query: UseInfiniteQueryResult<InfiniteData<Page>>
  /** Куда ведёт строка: карточка упражнения или растяжки */
  linkTo: (id: number) => string
  /** Что показать, если ничего не нашлось: сброс фильтров и «добавить своё» */
  emptyAction: ReactNode
}

const meta = (item: CatalogListItem) =>
  [item.muscles, item.equipment && EQUIPMENT_LABEL[item.equipment], item.holdSeconds != null && `${item.holdSeconds} с`]
    .filter(Boolean)
    .join(' · ')

// Выдача справочника страницами: общий справочник и свои черновики с пометкой «не проверено» (frontend-tz, 11.1)
export const CatalogResults = ({ query, linkTo, emptyAction }: CatalogResultsProps) => (
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
        <List>
          {data.pages
            .flatMap(page => page.items ?? [])
            .map(item => (
              <CatalogRow
                key={item.id}
                name={item.name}
                imageUrl={toAssetUrl(item.imageUrl) ?? null}
                meta={meta(item)}
                draft={item.draft}
                to={linkTo(item.id)}
              />
            ))}
        </List>
        <LoadMore query={query} />
      </div>
    )}
  </QueryScreen>
)
