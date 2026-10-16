import { CheckIcon, PlusIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import {
  type Equipment,
  EQUIPMENT_LABEL,
  type ExerciseFilter,
  FILTER_ALL,
  muscleFilterOptions,
  useCatalogExercises,
  useMuscles,
} from '@/entities/catalog'
import type { ProgramComplex, SupersetTarget } from '@/entities/program'
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
import { type CreatedExercise, ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

const ALL = FILTER_ALL

// Подбор упражнений в комплекс программы или шаблона: поиск и фильтры, как в справочнике (frontend-tz, 10.3).
// Свои черновики приходят вместе со справочником с пометкой «не проверено».
// Отдельная страница, а не шторка: список длинный, клавиатура съедает половину экрана.
// Поиск, фильтры и выбор живут в адресе: перезагрузка или «назад» из создания не сбрасывают подбор.
// Тап по строке открывает карточку в шторке, не уводя со страницы подбора
type ExercisePickerProps = {
  /** Комплекс, куда добавляем: уже стоящие в нём упражнения выключены */
  complex: ProgramComplex | undefined
  /** Назад — на страницу комплекса */
  back: string
  /** Добавить в суперсет: к упражнению комплекса или новым суперсетом (тогда выбрать хотя бы два) */
  target?: SupersetTarget
  adding: boolean
  onAdd: (exerciseIds: number[]) => void
}

export const ExercisePicker = ({ complex, back, target, adding, onAdd }: ExercisePickerProps) => {
  const muscles = useMuscles()
  const [params, setParams] = useSearchParams()

  // Поле ввода — своё состояние: значение из адреса меняется переходом и сбивало бы каретку
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const muscle = params.get('muscle') ?? ALL
  const equipment = (params.get('equipment') as Equipment | null) ?? ALL
  const picked = params.get('picked')?.split(',').map(Number) ?? []
  const [createOpen, setCreateOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [preview, setPreview] = useState<{ id: number; name: string } | null>(null)

  // replace: история не копит шаг на каждую букву поиска.
  // preventScrollReset: каждый «+» меняет адрес, и ScrollRestoration иначе кидал бы список наверх
  const patch = (next: Record<string, string | undefined>) =>
    setParams(
      prev => {
        for (const [key, value] of Object.entries(next)) {
          if (value) prev.set(key, value)
          else prev.delete(key)
        }
        return prev
      },
      { replace: true, preventScrollReset: true },
    )
  const setMuscle = (m: string) => patch({ muscle: m === ALL ? undefined : m })
  const setEquipment = (e: Equipment | 'ALL') => patch({ equipment: e === ALL ? undefined : e })

  const search = useDebouncedValue(query.trim())
  useEffect(() => patch({ q: search || undefined }), [search]) // eslint-disable-line react-hooks/exhaustive-deps
  const filter: ExerciseFilter = {
    search: search || undefined,
    filter_muscle: muscle === ALL ? undefined : Number(muscle),
    filter_equipment: equipment === ALL ? undefined : equipment,
  }
  const exercises = useCatalogExercises(filter)

  const present = new Set(complex?.exercises.map(e => e.exerciseId))
  const minPicked = target?.newSuperset ? 2 : 1
  const joined = complex?.exercises.find(e => e.id === target?.joinItemId)
  const subtitle = !complex
    ? undefined
    : target?.newSuperset
      ? `новый суперсет в «${complex.name}»`
      : joined
        ? `в суперсет с «${joined.name}»`
        : `в «${complex.name}»`
  const toggle = (id: number) =>
    patch({ picked: (picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id]).join(',') })

  const reset = () => {
    setQuery('')
    patch({ muscle: undefined, equipment: undefined })
  }

  // Нужного нет в справочнике — создаём своё и сразу добавляем в комплекс вместе с уже выбранными
  const addCreated = (created: CreatedExercise) => {
    const ids = [...new Set([...picked, created.id])].filter(id => !present.has(id))
    if (ids.length) onAdd(ids)
  }

  return (
    <Screen
      header={
        // Поиск и фильтры прилипают вместе с шапкой: результаты прокручиваются под ними
        <div className='bg-background border-border sticky top-(--sb-top-inset) z-30 border-b-[1.5px]'>
          <TopBar
            back={back}
            title='Добавить упражнение'
            subtitle={subtitle}
            action={
              <Button
                size='sm'
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon strokeWidth={2.5} />
                Новое
              </Button>
            }
          />
          {/* Пока печатаем в поиске, футер прячем: клавиатура и так съедает пол-экрана */}
          <div
            className='px-gutter pt-3 pb-3'
            onFocus={e => e.target instanceof HTMLInputElement && setTyping(true)}
            onBlur={e => e.target instanceof HTMLInputElement && setTyping(false)}
          >
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
        !typing && (
        <StickyFooter>
          <Button
            size='lg'
            disabled={picked.length < minPicked || adding}
            onClick={() => onAdd(picked)}
          >
            {picked.length === 0
              ? 'Выбери упражнения'
              : picked.length < minPicked
                ? 'Для суперсета нужно хотя бы два'
                : `Добавить · ${picked.length}`}
          </Button>
        </StickyFooter>
        )
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
                      onClick={() => setPreview(e)}
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

      <ExerciseSheet
        exercise={preview}
        onOpenChange={open => !open && setPreview(null)}
        action={
          preview &&
          (present.has(preview.id) ? (
            <Button
              size='lg'
              variant='outline'
              className='w-full'
              disabled
            >
              <CheckIcon strokeWidth={3} />
              Уже в комплексе
            </Button>
          ) : (
            <Button
              size='lg'
              variant={picked.includes(preview.id) ? 'outline' : 'default'}
              className='w-full'
              onClick={() => {
                toggle(preview.id)
                setPreview(null)
              }}
            >
              {picked.includes(preview.id) ? 'Убрать из выбора' : 'Выбрать'}
            </Button>
          ))
        }
      />

      <ExerciseCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={addCreated}
      />
    </Screen>
  )
}
