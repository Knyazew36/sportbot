import { PlusIcon } from 'lucide-react'

import { useState } from 'react'

import { muscleNames, normalizeName } from '@/entities/catalog/lib'
import { EQUIPMENT_LABEL } from '@/entities/catalog/types'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { exercises, stretches } from '../../model/catalog'

type Kind = 'exercise' | 'stretch'
type Gap = 'all' | 'no-image' | 'no-muscles'

const KINDS: { value: Kind; label: string }[] = [
  { value: 'exercise', label: 'Упражнения' },
  { value: 'stretch', label: 'Растяжки' },
]

// Фильтры наполнения: чего записи не хватает (frontend-tz, 14.1)
const GAPS: { value: Gap; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'no-image', label: 'Без картинки' },
  { value: 'no-muscles', label: 'Без мышц' },
]

export const CatalogTab = () => {
  const [kind, setKind] = useState<Kind>('exercise')
  const [gap, setGap] = useState<Gap>('all')
  const [query, setQuery] = useState('')

  const pool =
    kind === 'exercise'
      ? exercises.map(e => ({
          id: e.id,
          name: e.name,
          imageUrl: e.imageUrl,
          muscles: e.primaryMuscles,
          extra: e.equipment && EQUIPMENT_LABEL[e.equipment],
        }))
      : stretches.map(s => ({
          id: s.id,
          name: s.name,
          imageUrl: s.imageUrl,
          muscles: s.muscles,
          extra: `${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`,
        }))
  const found = pool.filter(
    x =>
      normalizeName(x.name).includes(normalizeName(query)) &&
      (gap === 'all' || (gap === 'no-image' ? !x.imageUrl : x.muscles.length === 0)),
  )

  return (
    <>
      <Rise className='flex flex-col gap-3 px-5'>
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
        <div className='no-scrollbar -mx-5 overflow-x-auto px-5 pb-1'>
          <Segmented
            options={GAPS}
            value={gap}
            onValueChange={setGap}
          />
        </div>
      </Rise>

      <Rise className='flex flex-col gap-3 px-5'>
        <div className='flex items-center justify-between gap-3'>
          <Eyebrow>найдено: {found.length}</Eyebrow>
          <ButtonLink
            to={buildPath(ROUTES.PREVIEW_ADMIN_CATALOG_ITEM, { kind, itemId: 'new' })}
            size='sm'
          >
            <PlusIcon strokeWidth={2.5} />
            Создать
          </ButtonLink>
        </div>
        {found.length === 0 ? (
          <ScreenState
            state='empty'
            title='Таких записей нет'
            description={gap === 'all' ? 'Попробуй другое название.' : 'Все записи заполнены — хороший знак.'}
          />
        ) : (
          <List>
            {found.map(x => (
              <CatalogRow
                key={x.id}
                name={x.name}
                imageUrl={x.imageUrl}
                meta={[muscleNames(x.muscles) || 'мышцы не указаны', x.extra].filter(Boolean).join(' · ')}
                to={buildPath(ROUTES.PREVIEW_ADMIN_CATALOG_ITEM, { kind, itemId: x.id })}
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
      </Rise>
    </>
  )
}
