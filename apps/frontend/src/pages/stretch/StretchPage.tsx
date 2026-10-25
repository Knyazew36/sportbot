import { useParams } from 'react-router'

import { useState } from 'react'

import { muscleNames, stretchGuide, useCatalogStretch } from '@sportbot/api/entities/catalog'
import { ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'
import { StretchEditSheet } from '@/widgets/catalog/StretchEditSheet'
import { CatalogGuide } from '@/widgets/catalog-guide/CatalogGuide'

import { StretchFooter } from './components/StretchFooter'
import { StretchHero } from './components/StretchHero'

const BACK = `${ROUTES.LIBRARY}?tab=stretches`

// Карточка растяжки (frontend-tz, 11.3): «Попробовать» запускает таймер удержания, как в заминке
const StretchPage = () => {
  const stretchId = Number(useParams().stretchId)
  const stretch = useCatalogStretch(stretchId)
  // 0 — таймер не запущен, 1 и 2 — сторона
  const [side, setSide] = useState<0 | 1 | 2>(0)
  const [editOpen, setEditOpen] = useState(false)
  const s = stretch.data

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={s?.name ?? 'Растяжка'}
          subtitle={s ? muscleNames(s.muscles) : undefined}
        />
      }
      footer={
        s && (
          <StretchFooter
            stretch={s}
            side={side}
            onSide={setSide}
            onEdit={() => setEditOpen(true)}
          />
        )
      }
      className='gap-7'
    >
      <QueryScreen query={stretch}>
        {st => (
          <>
            <StretchHero stretch={st} />
            <Rise className='px-gutter'>
              <StatGrid
                items={[
                  { label: 'удержание, с', value: st.holdSeconds },
                  { label: 'стороны', value: st.perSide ? '× 2' : '—' },
                  { label: 'всего, с', value: st.holdSeconds * (st.perSide ? 2 : 1) },
                ]}
              />
            </Rise>
            <CatalogGuide
              guide={stretchGuide(st)}
              title='Как делать'
              note={
                st.perSide && (
                  <Text
                    size='sm'
                    tone='muted'
                  >
                    На каждую сторону — время удваивается.
                  </Text>
                )
              }
            />
            <StretchEditSheet
              open={editOpen}
              onOpenChange={setEditOpen}
              stretch={st}
            />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StretchPage
