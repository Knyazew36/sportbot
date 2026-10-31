import { RepeatIcon } from 'lucide-react'

import { useState } from 'react'

import { EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogBrowser, type CatalogFilterState, EMPTY_CATALOG_FILTER } from '@/widgets/catalog/CatalogBrowser'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import type { ReplaceChoice } from './ReplaceChoiceSheet'

type OtherExercisesProps = {
  /** Упражнения, которые уже стоят в тренировке: помечены, заменить на них нельзя */
  presentIds: number[]
  onPreview: (exercise: ReplaceChoice) => void
  onChoose: (exercise: ReplaceChoice) => void
}

// Любое упражнение справочника через поиск и фильтры — когда среди аналогов нужного нет
export const OtherExercises = ({ presentIds, onPreview, onChoose }: OtherExercisesProps) => {
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER)

  return (
    <div className='-mx-gutter flex flex-col gap-4'>
      <CatalogBrowser
        kind='exercise'
        filter={filter}
        onFilterChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
        renderItem={e => {
          const present = presentIds.includes(e.id)
          return (
            <CatalogRow
              key={e.id}
              name={e.name}
              imageUrl={toAssetUrl(e.imageUrl) ?? null}
              meta={[e.muscles, e.equipment && EQUIPMENT_LABEL[e.equipment], present && 'уже в тренировке']
                .filter(Boolean)
                .join(' · ')}
              draft={e.draft}
              onClick={() => onPreview(e)}
              trail={
                !present && (
                  <Button
                    variant='outline'
                    size='icon-sm'
                    onClick={() => onChoose(e)}
                    aria-label={`Заменить на «${e.name}»`}
                  >
                    <RepeatIcon />
                  </Button>
                )
              }
            />
          )
        }}
      />
    </div>
  )
}
