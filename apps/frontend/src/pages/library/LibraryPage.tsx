import { useSearchParams } from 'react-router'

import { useState } from 'react'

import type { CatalogKind } from '@sportbot/api/entities/catalog'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { CatalogBrowser, type CatalogFilterState, EMPTY_CATALOG_FILTER } from '@/widgets/catalog/CatalogBrowser'
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet'

import { MineButton } from './components/MineButton'
import { MineTab } from './components/MineTab'
import { NewEntryLinks } from './components/NewEntryLinks'

type Tab = 'exercises' | 'stretches' | 'mine'

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
]

// Справочник (frontend-tz, 11): упражнения и растяжки с поиском и фильтрами, «Мои» со статусами заявок.
// Две вкладки и блок справочника; «Мои» — кнопкой в шапке: это не раздел справочника, а свои записи
const LibraryPage = () => {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab | null) ?? 'exercises'
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER)
  // Куда вернуться из «Моих» — на ту вкладку, с которой ушли
  const [lastTab, setLastTab] = useState<Exclude<Tab, 'mine'>>('exercises')
  // Какую запись создаём: шторки живут здесь, а не в кнопках — кнопки из пустого состояния пропадают с первой записью
  const [creating, setCreating] = useState<CatalogKind | null>(null)

  const openTab = (next: Tab) => setParams(next === 'exercises' ? {} : { tab: next }, { replace: true })

  return (
    <Screen
      header={
        <>
          <ScreenHeader
            title={tab === 'mine' ? 'Справочник · мои' : 'Справочник'}
            action={
              <MineButton
                active={tab === 'mine'}
                onClick={() => {
                  if (tab !== 'mine') setLastTab(tab)
                  openTab(tab === 'mine' ? lastTab : 'mine')
                }}
              />
            }
          />
          {/* В «Моих» своя вкладка упражнений и растяжек — общая сверху её дублировала бы */}
          {tab !== 'mine' && (
            <div className='px-gutter flex flex-col gap-3 pt-4'>
              <Segmented
                options={TABS}
                value={tab}
                onValueChange={openTab}
                size='default'
                stretch
              />
            </div>
          )}
        </>
      }
      footer={
        tab === 'mine' && (
          <StickyFooter>
            <NewEntryLinks onCreate={setCreating} />
          </StickyFooter>
        )
      }
      className='gap-5 pt-4'
    >
      {tab === 'mine' ? (
        <MineTab />
      ) : (
        <CatalogBrowser
          kind={tab === 'exercises' ? 'exercise' : 'stretch'}
          filter={filter}
          onFilterChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
          linkTo={id =>
            tab === 'exercises'
              ? buildPath(ROUTES.EXERCISE, { exerciseId: id })
              : buildPath(ROUTES.STRETCH, { stretchId: id })
          }
          emptyAction={<NewEntryLinks onCreate={setCreating} />}
        />
      )}
      <ExerciseCreateSheet
        open={creating === 'exercise'}
        onOpenChange={open => !open && setCreating(null)}
      />
      <StretchCreateSheet
        open={creating === 'stretch'}
        onOpenChange={open => !open && setCreating(null)}
      />
    </Screen>
  )
}

export default LibraryPage
