import { PlusIcon } from 'lucide-react'

import { useState } from 'react'

import { type AdminCatalogKind, useAdminCatalog } from '@/entities/admin'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { List } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet'

type Gap = 'all' | 'no-image' | 'no-muscles' | 'user-published' | 'private'

const KINDS: { value: AdminCatalogKind; label: string }[] = [
  { value: 'exercise', label: 'Упражнения' },
  { value: 'stretch', label: 'Растяжки' },
]

// Фильтры наполнения (чего записи не хватает, frontend-tz, 14.1) и публикации: что пришло от пользователей
const GAPS: { value: Gap; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'no-image', label: 'Без картинки' },
  { value: 'no-muscles', label: 'Без мышц' },
  { value: 'user-published', label: 'От пользователей' },
  { value: 'private', label: 'Не в справочнике' },
]

export const CatalogTab = () => {
  const [kind, setKind] = useState<AdminCatalogKind>('exercise')
  const [gap, setGap] = useState<Gap>('all')
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const search = useDebouncedValue(query.trim())
  const catalog = useAdminCatalog(kind, {
    search: search || undefined,
    filter_noImage: gap === 'no-image' || undefined,
    filter_noMuscles: gap === 'no-muscles' || undefined,
    filter_userMade: gap === 'user-published' || undefined,
    filter_status: gap === 'user-published' ? 'CATALOG' : gap === 'private' ? 'DRAFT' : undefined,
  })

  return (
    <>
      <Rise className='px-gutter flex flex-col gap-3'>
        <Segmented
          options={KINDS}
          value={kind}
          onValueChange={setKind}
          size='default'
          stretch
        />
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder='Название записи'
        />
        <div className='no-scrollbar -mx-gutter px-gutter overflow-x-auto pb-1'>
          <Segmented
            options={GAPS}
            value={gap}
            onValueChange={setGap}
          />
        </div>
      </Rise>

      <Rise className='px-gutter flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <Eyebrow>найдено: {catalog.data?.pages[0]?.meta?.total ?? '—'}</Eyebrow>
          <Button
            size='sm'
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon strokeWidth={2.5} />
            Создать
          </Button>
        </div>
        <QueryScreen
          query={catalog}
          className=''
          isEmpty={data => !data.pages[0]?.items?.length}
          empty={{
            title: 'Таких записей нет',
            description: gap === 'all' ? 'Попробуй другое название.' : 'Все записи заполнены — хороший знак.',
          }}
        >
          {data => (
            <List>
              {data.pages
                .flatMap(page => page.items ?? [])
                .map(x => (
                  <CatalogRow
                    key={x.id}
                    name={x.name}
                    imageUrl={toAssetUrl(x.imageUrl) ?? null}
                    meta={[x.muscleCount ? `мышц: ${x.muscleCount}` : 'мышцы не указаны', x.code]
                      .filter(Boolean)
                      .join(' · ')}
                    draft={x.status === 'DRAFT'}
                    to={buildPath(ROUTES.ADMIN_CATALOG_ITEM, { kind, itemId: x.id })}
                  >
                    {!x.imageUrl && (
                      <Badge
                        variant='destructive'
                        className='mt-2'
                      >
                        без картинки
                      </Badge>
                    )}
                  </CatalogRow>
                ))}
            </List>
          )}
        </QueryScreen>
        <LoadMore query={catalog} />
      </Rise>
      {/* Те же шторки, что в справочнике, но из админки запись сразу попадает в справочник */}
      <ExerciseCreateSheet
        open={createOpen && kind === 'exercise'}
        onOpenChange={setCreateOpen}
        direct
      />
      <StretchCreateSheet
        open={createOpen && kind === 'stretch'}
        onOpenChange={setCreateOpen}
        direct
      />
    </>
  )
}
