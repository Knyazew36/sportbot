import { CheckIcon, PlusIcon } from 'lucide-react'

import { useState } from 'react'

import {
  type Equipment,
  EQUIPMENT_LABEL,
  type ExerciseFilter,
  FILTER_ALL,
  muscleFilterOptions,
  useCatalogExercises,
  useMuscles,
} from '@/entities/catalog'
import type { ProgramComplex } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { List } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogFilters } from '@/widgets/catalog/CatalogFilters'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

const ALL = FILTER_ALL

// Подбор упражнений в комплекс программы или шаблона: поиск и фильтры, как в справочнике (frontend-tz, 10.3).
// Свои черновики приходят вместе со справочником с пометкой «не проверено».
// Отдельная страница, а не шторка: список длинный, клавиатура съедает половину экрана
type ExercisePickerProps = {
  /** Комплекс, куда добавляем: уже стоящие в нём упражнения выключены */
  complex: ProgramComplex | undefined
  /** Назад — на страницу комплекса */
  back: string
  adding: boolean
  onAdd: (exerciseIds: number[]) => void
}

export const ExercisePicker = ({ complex, back, adding, onAdd }: ExercisePickerProps) => {
  const muscles = useMuscles()

  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState(ALL)
  const [equipment, setEquipment] = useState<Equipment | 'ALL'>(ALL)
  const [picked, setPicked] = useState<number[]>([])

  const search = useDebouncedValue(query.trim())
  const filter: ExerciseFilter = {
    search: search || undefined,
    filter_muscle: muscle === ALL ? undefined : Number(muscle),
    filter_equipment: equipment === ALL ? undefined : equipment,
  }
  const exercises = useCatalogExercises(filter)

  const present = new Set(complex?.exercises.map(e => e.exerciseId))
  const toggle = (id: number) => setPicked(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))

  const reset = () => {
    setQuery('')
    setMuscle(ALL)
    setEquipment(ALL)
  }

  return (
    <Screen
      header={
        // Поиск и фильтры прилипают вместе с шапкой: результаты прокручиваются под ними
        <div className='bg-background border-border sticky top-(--sb-top-inset) z-30 border-b-[1.5px]'>
          <TopBar
            back={back}
            title='Добавить упражнение'
            subtitle={complex ? `в «${complex.name}»` : undefined}
          />
          <div className='px-gutter pt-3 pb-3'>
            <CatalogFilters
              query={query}
              onQueryChange={setQuery}
              group={muscle}
              onGroupChange={setMuscle}
              groups={muscleFilterOptions(muscles.data)}
              equipment={equipment}
              onEquipmentChange={setEquipment}
            />
          </div>
        </div>
      }
      footer={
        <StickyFooter>
          <Button
            size='xl'
            disabled={picked.length === 0 || adding}
            onClick={() => onAdd(picked)}
          >
            {picked.length === 0 ? 'Выбери упражнения' : `Добавить · ${picked.length}`}
          </Button>
        </StickyFooter>
      }
      className='px-gutter pt-4'
    >
      <QueryScreen
        query={exercises}
        className=''
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{
          title: 'Ничего не нашлось',
          description: 'Попробуй другое название или сними фильтры.',
          action: (
            <Button
              variant='outline'
              size='sm'
              onClick={reset}
            >
              Сбросить фильтры
            </Button>
          ),
        }}
      >
        {data => (
          <Rise className='flex flex-col gap-4'>
            <List>
              {data.pages
                .flatMap(page => page.items ?? [])
                .map(e => {
                  const on = picked.includes(e.id)
                  const inComplex = present.has(e.id)
                  return (
                    <CatalogRow
                      key={e.id}
                      name={e.name}
                      imageUrl={toAssetUrl(e.imageUrl) ?? null}
                      meta={[e.muscles, e.equipment && EQUIPMENT_LABEL[e.equipment], inComplex && 'уже в комплексе']
                        .filter(Boolean)
                        .join(' · ')}
                      draft={e.draft}
                      selected={on}
                      trail={
                        <Button
                          variant={on ? 'default' : 'outline'}
                          size='icon-sm'
                          disabled={inComplex}
                          aria-pressed={on}
                          aria-label={on ? `Убрать «${e.name}»` : `Выбрать «${e.name}»`}
                          onClick={() => toggle(e.id)}
                        >
                          {on || inComplex ? <CheckIcon strokeWidth={3} /> : <PlusIcon strokeWidth={2.5} />}
                        </Button>
                      }
                    />
                  )
                })}
            </List>
            <LoadMore query={exercises} />
          </Rise>
        )}
      </QueryScreen>
    </Screen>
  )
}

