import { CheckIcon, PlusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { matchesCatalog, muscleNames } from '@/entities/catalog/lib'
import { type Equipment, EQUIPMENT_LABEL } from '@/entities/catalog/types'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogFilters } from '@/widgets/catalog/CatalogFilters'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { exercises, myEntries } from './model/catalog'
import { editorPathOf, setDraft, useProgramDraft } from './model/program-drafts'

// В подборе — справочник и свои черновики: их можно ставить в комплекс до проверки (business-tz, 5.5)
const pool = [
  ...exercises.map(e => ({ ...e, draft: false })),
  ...myEntries
    .filter(e => e.kind === 'exercise' && (e.outcome === 'PENDING' || e.outcome === 'REJECTED'))
    .map(e => ({ id: e.id, name: e.name, imageUrl: null, equipment: null, primaryMuscles: e.muscles, draft: true })),
]

// Подбор упражнений в комплекс: поиск и фильтры, как в справочнике (frontend-tz, 10.3).
// Отдельная страница, а не шторка: список длинный, клавиатура съедает половину экрана
const AddExerciseScreen = () => {
  const { programId = 'new', complexId = '' } = useParams()
  const navigate = useNavigate()
  const complex = useProgramDraft(programId).find(c => String(c.id) === complexId)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Все')
  const [equipment, setEquipment] = useState<Equipment | 'ALL'>('ALL')
  const [picked, setPicked] = useState<number[]>([])

  const editorPath = `${editorPathOf(programId)}?open=${complexId}`
  const found = pool.filter(e => matchesCatalog({ ...e, muscles: e.primaryMuscles }, { query, group, equipment }))
  const toggle = (id: number) => setPicked(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))

  const add = () => {
    const chosen = pool
      .filter(e => picked.includes(e.id))
      .map((e, i) => ({
        id: Date.now() + i,
        name: e.name,
        muscles: muscleNames(e.primaryMuscles),
        sets: 3,
        reps: '8–12',
        draft: e.draft,
      }))
    setDraft(programId, list =>
      list.map(c => (String(c.id) === complexId ? { ...c, exercises: [...c.exercises, ...chosen] } : c)),
    )
    navigate(editorPath)
  }

  return (
    <Screen
      header={
        // Поиск и фильтры прилипают вместе с шапкой: результаты прокручиваются под ними
        <div className='bg-background border-border sticky top-0 z-30 border-b-[1.5px]'>
          <TopBar
            back={editorPath}
            title='Добавить упражнение'
            subtitle={complex ? `в «${complex.title}»` : undefined}
          />
          <div className='px-gutter pt-3 pb-3'>
            <CatalogFilters
              query={query}
              onQueryChange={setQuery}
              group={group}
              onGroupChange={setGroup}
              equipment={equipment}
              onEquipmentChange={setEquipment}
            />
          </div>
        </div>
      }
      footer={
        <StickyFooter>
          <Button
            size='lg'
            className='w-full'
            disabled={picked.length === 0}
            onClick={add}
          >
            {picked.length === 0 ? 'Выбери упражнения' : `Добавить · ${picked.length}`}
          </Button>
        </StickyFooter>
      }
      className='px-gutter pt-4'
    >
      <Rise>
        {found.length === 0 ? (
          <ScreenState
            state='empty'
            title='Ничего не нашлось'
            description='Попробуй другое название или сними фильтры.'
            action={
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setQuery('')
                  setGroup('Все')
                  setEquipment('ALL')
                }}
              >
                Сбросить фильтры
              </Button>
            }
          />
        ) : (
          <List>
            {found.map(e => {
              const on = picked.includes(e.id)
              return (
                <CatalogRow
                  key={`${e.draft ? 'd' : 'c'}-${e.id}`}
                  name={e.name}
                  imageUrl={e.imageUrl}
                  meta={[muscleNames(e.primaryMuscles), e.equipment && EQUIPMENT_LABEL[e.equipment]]
                    .filter(Boolean)
                    .join(' · ')}
                  draft={e.draft}
                  selected={on}
                  trail={
                    <Button
                      variant={on ? 'default' : 'outline'}
                      size='icon-sm'
                      aria-pressed={on}
                      aria-label={on ? `Убрать «${e.name}»` : `Выбрать «${e.name}»`}
                      onClick={() => toggle(e.id)}
                    >
                      {on ? <CheckIcon strokeWidth={3} /> : <PlusIcon strokeWidth={2.5} />}
                    </Button>
                  }
                />
              )
            })}
          </List>
        )}
      </Rise>
    </Screen>
  )
}

export default AddExerciseScreen
