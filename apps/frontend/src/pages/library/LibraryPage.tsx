import { useSearchParams } from 'react-router'

import { useState } from 'react'

import {
  type CatalogKind,
  type Equipment,
  FILTER_ALL,
  muscleFilterOptions,
  useCatalogExercises,
  useCatalogStretches,
  useMuscles,
} from '@/entities/catalog'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogFilters } from '@/widgets/catalog/CatalogFilters'
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { StretchCreateSheet } from '@/widgets/catalog/StretchCreateSheet'

import { CatalogResults } from './components/CatalogResults'
import { MineTab } from './components/MineTab'
import { NewEntryLinks } from './components/NewEntryLinks'

type Tab = 'exercises' | 'stretches' | 'mine'

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
  { value: 'mine' as const, label: 'Мои' },
]

// Справочник (frontend-tz, 11): упражнения и растяжки с поиском и фильтрами, вкладка «Мои» со статусами заявок
const LibraryPage = () => {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab | null) ?? 'exercises'
  const muscles = useMuscles()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState(FILTER_ALL)
  const [equipment, setEquipment] = useState<Equipment | 'ALL'>(FILTER_ALL)
  // Какую запись создаём: шторки живут здесь, а не в кнопках — кнопки из пустого состояния пропадают с первой записью
  const [creating, setCreating] = useState<CatalogKind | null>(null)

  const search = useDebouncedValue(query.trim()) || undefined
  const filterMuscle = muscle === FILTER_ALL ? undefined : Number(muscle)
  const exercises = useCatalogExercises({
    search,
    filter_muscle: filterMuscle,
    filter_equipment: equipment === FILTER_ALL ? undefined : equipment,
  })
  const stretches = useCatalogStretches({ search, filter_muscle: filterMuscle })

  const reset = () => {
    setQuery('')
    setMuscle(FILTER_ALL)
    setEquipment(FILTER_ALL)
  }

  const emptyAction = (
    <div className='flex w-full flex-col gap-2'>
      <Button
        variant='outline'
        size='sm'
        className='self-start'
        onClick={reset}
      >
        Сбросить фильтры
      </Button>
      <NewEntryLinks onCreate={setCreating} />
    </div>
  )

  return (
    <Screen
      header={
        <>
          <ScreenHeader title='Справочник' />
          <div className='px-gutter flex flex-col gap-3 pt-4'>
            <Segmented
              options={TABS}
              value={tab}
              onValueChange={next => setParams(next === 'exercises' ? {} : { tab: next }, { replace: true })}
              size='default'
              stretch
            />
          </div>
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
        <>
          <Rise className='px-gutter'>
            <CatalogFilters
              query={query}
              onQueryChange={setQuery}
              group={muscle}
              onGroupChange={setMuscle}
              groups={muscleFilterOptions(muscles.data)}
              equipment={tab === 'exercises' ? equipment : undefined}
              onEquipmentChange={setEquipment}
              placeholder={tab === 'exercises' ? 'Название упражнения' : 'Название растяжки'}
            />
          </Rise>
          <Rise className='px-gutter'>
            {tab === 'exercises' ? (
              <CatalogResults
                query={exercises}
                linkTo={id => buildPath(ROUTES.EXERCISE, { exerciseId: id })}
                emptyAction={emptyAction}
              />
            ) : (
              <CatalogResults
                query={stretches}
                linkTo={id => buildPath(ROUTES.STRETCH, { stretchId: id })}
                emptyAction={emptyAction}
              />
            )}
          </Rise>
        </>
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
