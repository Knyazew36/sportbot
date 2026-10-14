import { ArrowUpRightIcon, PlusIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { useState } from 'react'

import { matchesCatalog, muscleNames } from '@/entities/catalog/lib'
import { type Equipment, EQUIPMENT_LABEL, MODERATION_LABEL, type ModerationOutcome } from '@/entities/catalog/types'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { CatalogFilters } from '@/widgets/catalog/CatalogFilters'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { DAILY_SUBMISSIONS, exercises, myEntries, stretches } from './model/catalog'

type Tab = 'exercises' | 'stretches' | 'mine'

const TABS = [
  { value: 'exercises' as const, label: 'Упражнения' },
  { value: 'stretches' as const, label: 'Растяжки' },
  { value: 'mine' as const, label: 'Мои' },
]

// Переключатель только для превью: показать состояния списка из frontend-tz, раздел 15
type DemoState = 'data' | 'loading' | 'empty' | 'error'

const DEMO_STATES: { value: DemoState; label: string }[] = [
  { value: 'data', label: 'Данные' },
  { value: 'loading', label: 'Загрузка' },
  { value: 'empty', label: 'Пусто' },
  { value: 'error', label: 'Ошибка' },
]

// Черновики автора, ещё не попавшие в справочник, видны в общей выдаче с пометкой «не проверено»
const myDrafts = myEntries.filter(e => e.outcome === 'PENDING' || e.outcome === 'REJECTED')

const OUTCOME_TONE: Record<ModerationOutcome, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'default',
  APPROVED_EDITED: 'default',
  DUPLICATE: 'secondary',
  REJECTED: 'destructive',
}

const NewEntryLinks = () => (
  <div className='grid grid-cols-2 gap-2'>
    <ButtonLink
      to={`${ROUTES.PREVIEW_LIBRARY_NEW}?kind=exercise`}
      variant='outline'
      size='sm'
      className='h-11'
    >
      <PlusIcon strokeWidth={2.5} />
      Упражнение
    </ButtonLink>
    <ButtonLink
      to={`${ROUTES.PREVIEW_LIBRARY_NEW}?kind=stretch`}
      variant='outline'
      size='sm'
      className='h-11'
    >
      <PlusIcon strokeWidth={2.5} />
      Растяжку
    </ButtonLink>
  </div>
)

// Вкладка «Мои»: свои записи со статусом модерации (frontend-tz, 11.5)
const MineTab = () => (
  <Rise className='flex flex-col gap-4 px-gutter'>
    <List>
      {myEntries.map(e => {
        const catalogPath =
          e.catalogId &&
          (e.kind === 'exercise'
            ? buildPath(ROUTES.PREVIEW_EXERCISE, { exerciseId: e.catalogId })
            : buildPath(ROUTES.PREVIEW_STRETCH, { stretchId: e.catalogId }))
        return (
          <ListRow
            key={e.id}
            title={e.name}
            meta={`${e.kind === 'exercise' ? 'Упражнение' : 'Растяжка'} · ${muscleNames(e.muscles)} · ${e.createdAt}`}
          >
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <Badge variant={OUTCOME_TONE[e.outcome]}>{MODERATION_LABEL[e.outcome]}</Badge>
              {e.outcome === 'PENDING' && (
                <Text
                  as='span'
                  size='xs'
                  tone='muted'
                >
                  черновик, можно ставить в комплексы
                </Text>
              )}
            </div>
            {e.reason && (
              <Text
                size='sm'
                tone='soft'
                className='mt-2'
              >
                «{e.reason}»
              </Text>
            )}
            {catalogPath && (
              <Link
                to={catalogPath}
                className='text-primary mt-2 inline-flex items-center gap-1 text-[14px] underline-offset-4 hover:underline'
              >
                {e.outcome === 'DUPLICATE' ? 'Заменён записью справочника' : 'Запись в справочнике'}
                <ArrowUpRightIcon className='size-3.5' />
              </Link>
            )}
          </ListRow>
        )
      })}
    </List>
    <Text
      size='xs'
      tone='muted'
    >
      Заявок сегодня: {DAILY_SUBMISSIONS.used} из {DAILY_SUBMISSIONS.limit}
    </Text>
  </Rise>
)

const LibraryScreen = () => {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab | null) ?? 'exercises'
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Все')
  const [equipment, setEquipment] = useState<Equipment | 'ALL'>('ALL')
  const [demo, setDemo] = useState<DemoState>('data')

  const filter = { query, group, equipment }
  const foundExercises = [
    ...exercises.filter(e => matchesCatalog({ ...e, muscles: e.primaryMuscles }, filter)),
    ...myDrafts
      .filter(d => d.kind === 'exercise' && matchesCatalog({ ...d, equipment: null }, { query, group }))
      .map(d => ({ id: d.id, name: d.name, imageUrl: null, equipment: null, primaryMuscles: d.muscles, draft: true })),
  ]
  const foundStretches = stretches.filter(s => matchesCatalog(s, { query, group }))
  const found = tab === 'exercises' ? foundExercises.length : foundStretches.length
  const resetFilters = () => {
    setQuery('')
    setGroup('Все')
    setEquipment('ALL')
  }

  const results = () => {
    if (demo === 'loading') return <ScreenState state='loading' />
    if (demo === 'error')
      return (
        <ScreenState
          state='error'
          action={
            <Button
              size='sm'
              onClick={() => setDemo('data')}
            >
              Повторить
            </Button>
          }
        />
      )
    if (demo === 'empty' || found === 0)
      return (
        <ScreenState
          state='empty'
          title='Ничего не нашлось'
          description='Попробуй другое название или сними фильтры. Нет нужного — добавь своё.'
          action={
            <div className='flex w-full flex-col gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='self-start'
                onClick={() => {
                  resetFilters()
                  setDemo('data')
                }}
              >
                Сбросить фильтры
              </Button>
              <NewEntryLinks />
            </div>
          }
        />
      )
    return (
      <List>
        {tab === 'exercises'
          ? foundExercises.map(e => (
              <CatalogRow
                key={`${'draft' in e ? 'd' : 'c'}-${e.id}`}
                name={e.name}
                imageUrl={e.imageUrl}
                meta={[muscleNames(e.primaryMuscles), e.equipment && EQUIPMENT_LABEL[e.equipment]]
                  .filter(Boolean)
                  .join(' · ')}
                draft={'draft' in e}
                to={'draft' in e ? undefined : buildPath(ROUTES.PREVIEW_EXERCISE, { exerciseId: e.id })}
              />
            ))
          : foundStretches.map(s => (
              <CatalogRow
                key={s.id}
                name={s.name}
                imageUrl={s.imageUrl}
                meta={`${muscleNames(s.muscles)} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                to={buildPath(ROUTES.PREVIEW_STRETCH, { stretchId: s.id })}
              />
            ))}
      </List>
    )
  }

  return (
    <Screen
      key={tab}
      header={
        <>
          <ScreenHeader
            title='Справочник'
            aside={`${exercises.length + stretches.length} записей`}
          />
          <div className='flex flex-col gap-3 px-gutter pt-4'>
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
            <NewEntryLinks />
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
              group={group}
              onGroupChange={setGroup}
              equipment={tab === 'exercises' ? equipment : undefined}
              onEquipmentChange={setEquipment}
              placeholder={tab === 'exercises' ? 'Название упражнения' : 'Название растяжки'}
            />
          </Rise>
          <Rise className='flex flex-col gap-3 px-gutter'>
            <div className='no-scrollbar -mx-gutter flex items-center gap-2 overflow-x-auto px-gutter'>
              <Eyebrow className='shrink-0'>превью:</Eyebrow>
              <ToggleGroup
                value={[demo]}
                onValueChange={([v]) => v && setDemo(v as DemoState)}
              >
                {DEMO_STATES.map(s => (
                  <ToggleGroupItem
                    key={s.value}
                    value={s.value}
                    size='sm'
                  >
                    {s.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Eyebrow
              as='p'
              className={cn(demo !== 'data' && 'invisible')}
            >
              найдено: {found}
            </Eyebrow>
            {results()}
          </Rise>
        </>
      )}
    </Screen>
  )
}

export default LibraryScreen
