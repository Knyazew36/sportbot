import { CheckIcon, PlusIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import { type Equipment, EQUIPMENT_LABEL } from '@/entities/catalog'
import type { SupersetTarget } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogBrowser, type CatalogFilterState } from '@/widgets/catalog/CatalogBrowser'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { type CreatedExercise, ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

// Подбор упражнений в комплекс программы, шаблона или в идущую тренировку (frontend-tz, 10.3).
// Тот же блок справочника, что в /library: поиск, чипы мышц и инвентаря со шторками, выдача.
// Свои черновики приходят вместе со справочником с пометкой «не проверено».
// Отдельная страница, а не шторка: список длинный, клавиатура съедает половину экрана.
// Поиск, фильтры и выбор живут в адресе: перезагрузка или «назад» из создания не сбрасывают подбор.
// Тап по строке открывает карточку в шторке, не уводя со страницы подбора
type ExercisePickerProps = {
  /** Упражнения, которые уже стоят там, куда добавляем: помечены, но их можно добавить ещё раз */
  presentIds: number[]
  /** Куда добавляем — подпись под заголовком */
  subtitle?: string
  /** Назад — туда, куда добавляем */
  back: string
  /** Добавить в суперсет: к упражнению комплекса или новым суперсетом (тогда выбрать хотя бы два) */
  target?: SupersetTarget
  adding: boolean
  onAdd: (exerciseIds: number[]) => void
  /** Шаблон админа: новое упражнение сразу в справочник — в опубликованном шаблоне личных быть не должно */
  directCreate?: boolean
}

const list = (value: string | null) => value?.split(',').filter(Boolean) ?? []

export const ExercisePicker = ({
  presentIds,
  subtitle,
  back,
  target,
  adding,
  onAdd,
  directCreate,
}: ExercisePickerProps) => {
  const [params, setParams] = useSearchParams()

  // Поле ввода — своё состояние: значение из адреса меняется переходом и сбивало бы каретку
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const muscleCodes = list(params.get('muscles'))
  const equipment = (params.get('equipment') as Equipment | null) ?? 'ALL'
  const picked = list(params.get('picked')).map(Number)
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

  const search = useDebouncedValue(query.trim())
  useEffect(() => patch({ q: search || undefined }), [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const filter: CatalogFilterState = { query, muscleCodes, equipment }
  const changeFilter = (next: Partial<CatalogFilterState>) => {
    if (next.query !== undefined) setQuery(next.query)
    patch({
      ...(next.muscleCodes && { muscles: next.muscleCodes.join(',') || undefined }),
      ...(next.equipment && { equipment: next.equipment === 'ALL' ? undefined : next.equipment }),
    })
  }

  const present = new Set(presentIds)
  const minPicked = target?.newSuperset ? 2 : 1
  const toggle = (id: number) =>
    patch({ picked: (picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id]).join(',') })

  // Нужного нет в справочнике — создаём своё и сразу добавляем вместе с уже выбранными
  const addCreated = (created: CreatedExercise) => {
    onAdd([...new Set([...picked, created.id])])
  }

  return (
    <Screen
      header={
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
      }
      footer={
        // Пока печатаем в поиске, футер прячем: клавиатура и так съедает пол-экрана
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
      className='gap-5 pt-4'
    >
      <div
        className='contents'
        onFocus={e => e.target instanceof HTMLInputElement && setTyping(true)}
        onBlur={e => e.target instanceof HTMLInputElement && setTyping(false)}
      >
        <CatalogBrowser
          kind='exercise'
          filter={filter}
          onFilterChange={changeFilter}
          emptyAction={
            <Button
              variant='outline'
              size='sm'
              className='self-start'
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon strokeWidth={2.5} />
              Добавить своё
            </Button>
          }
          renderItem={e => {
            const on = picked.includes(e.id)
            return (
              <CatalogRow
                key={e.id}
                name={e.name}
                imageUrl={toAssetUrl(e.imageUrl) ?? null}
                meta={[e.muscles, e.equipment && EQUIPMENT_LABEL[e.equipment], present.has(e.id) && 'уже в тренировке']
                  .filter(Boolean)
                  .join(' · ')}
                draft={e.draft}
                onClick={() => setPreview(e)}
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
          }}
        />
      </div>

      <ExerciseSheet
        exercise={preview}
        onOpenChange={open => !open && setPreview(null)}
        action={
          preview && (
            <Button
              size='lg'
              variant={picked.includes(preview.id) ? 'outline' : 'default'}
              className='w-full'
              onClick={() => {
                toggle(preview.id)
                setPreview(null)
              }}
            >
              {picked.includes(preview.id)
                ? 'Убрать из выбора'
                : present.has(preview.id)
                  ? 'Выбрать ещё раз'
                  : 'Выбрать'}
            </Button>
          )
        }
      />

      <ExerciseCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={addCreated}
        direct={directCreate}
      />
    </Screen>
  )
}
