import { pluralize } from '@front-cmdt/utils/pluralize'

import { useState } from 'react'

import type { StretchRoutine } from '@sportbot/api/entities/stretch-routine'
import { toAssetUrl } from '@/shared/api'
import { List } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

// Состав комплекса. Карточка — в шторке, чтобы не терять место в списке
export const RoutineStretches = ({ stretches }: { stretches: StretchRoutine['stretches'] }) => {
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)
  return (
    <ScreenSection
      title='Состав'
      aside={pluralize(stretches.length, ['растяжка', 'растяжки', 'растяжек'])}
    >
      <List>
        {stretches.map(s => (
          <CatalogRow
            key={s.id}
            name={s.name}
            imageUrl={toAssetUrl(s.imageUrl) ?? null}
            meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
            onClick={() => setOpened({ id: s.id, name: s.name })}
          />
        ))}
      </List>
      <ExerciseSheet
        exercise={opened}
        kind='stretch'
        onOpenChange={open => !open && setOpened(null)}
      />
    </ScreenSection>
  )
}
