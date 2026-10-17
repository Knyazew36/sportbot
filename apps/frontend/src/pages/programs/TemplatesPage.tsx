import { ArrowRightIcon, RotateCcwIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import {
  type CatalogScope,
  SEARCH_PARAM,
  selectedTagIds,
  selectionFromParams,
  SORT_PARAM,
  SOURCE_PARAM,
  type TagSelection,
  useCatalog,
  useTemplateTagGroups,
} from '@/entities/program'
import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram'
import { ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TemplateFilter } from '@/widgets/template-filter/TemplateFilter'

import { byPopularity, CatalogShowcase } from './components/CatalogShowcase'
import { TemplateCard } from './components/TemplateCard'

type CatalogSort = 'default' | 'popular'

const SCOPE_OPTIONS: { value: CatalogScope; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'templates', label: 'Каталог' },
  { value: 'users', label: 'Пользователей' },
]

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'default', label: 'Рекомендуем' },
  { value: 'popular', label: 'Популярные' },
]

const PROGRAM_FORMS: [string, string, string] = ['программа', 'программы', 'программ']

// Каталог программ (frontend-tz, 10.2): шаблоны и программы пользователей одной витриной.
// Без фильтров — полки «Популярное» и «От сообщества» над общим списком; с фильтром — один список результатов
const TemplatesPage = () => {
  const groups = useTemplateTagGroups()
  const blank = useCreateBlankProgram()
  // Фильтры в ссылке: выборку можно переслать и вернуть кнопкой «назад»
  const [params, setParams] = useSearchParams()
  const sourceParam = params.get(SOURCE_PARAM)
  const scope: CatalogScope = sourceParam === 'users' || sourceParam === 'templates' ? sourceParam : 'all'
  const sort: CatalogSort = params.get(SORT_PARAM) === 'popular' ? 'popular' : 'default'
  const selection = selectionFromParams(groups.data ?? [], params)
  const [query, setQuery] = useState(params.get(SEARCH_PARAM) ?? '')
  const search = useDebouncedValue(query.trim())
  const filtered = Object.keys(selection).length > 0 || search !== '' || scope !== 'all' || sort !== 'default'
  const catalog = useCatalog({ scope, tagIds: selectedTagIds(groups.data ?? [], selection), search })
  const merged = catalog.data ? [...catalog.data.templates, ...catalog.data.users] : []
  const list = sort === 'popular' ? byPopularity(merged) : merged

  // Поиск попадает в ссылку после паузы, как и в запрос — история не копит каждую букву
  useEffect(() => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (search) next.set(SEARCH_PARAM, search)
        else next.delete(SEARCH_PARAM)
        return next
      },
      { replace: true },
    )
  }, [search, setParams])

  const setParam = (key: string, value: string | null) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  // Теги заменяются целиком, источник, сортировка и поиск остаются
  const select = (next: TagSelection) =>
    setParams(
      prev => {
        const kept = new URLSearchParams(next)
        for (const key of [SEARCH_PARAM, SOURCE_PARAM, SORT_PARAM]) {
          const value = prev.get(key)
          if (value) kept.set(key, value)
        }
        return kept
      },
      { replace: true },
    )

  const reset = () => {
    setQuery('')
    setParams({}, { replace: true })
  }

  const resetAction = (
    <div className='flex flex-wrap justify-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={reset}
      >
        <RotateCcwIcon />
        Сбросить фильтры
      </Button>
      <Button
        size='sm'
        disabled={blank.isPending}
        onClick={() => void blank.create()}
      >
        Собрать свою
        <ArrowRightIcon />
      </Button>
    </div>
  )

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title='Каталог'
          subtitle={catalog.data ? pluralize(merged.length, PROGRAM_FORMS) : undefined}
        />
      }
      className='gap-8 pt-4'
    >
      <Rise className='px-gutter'>
        <TemplateFilter
          groups={groups.data ?? []}
          selection={selection}
          onSelectionChange={select}
          search={query}
          onSearchChange={setQuery}
          moreActive={(scope !== 'all' ? 1 : 0) + (sort !== 'default' ? 1 : 0)}
          onReset={filtered ? reset : undefined}
          // Только число: «Показать 3 программы» рядом со «Сбросить» не влезает в 375px
          showLabel={catalog.data ? `Показать · ${merged.length}` : 'Показать'}
          more={
            <>
              <div className='flex flex-col gap-1.5'>
                <Eyebrow as='p'>Чьи</Eyebrow>
                <Segmented
                  options={SCOPE_OPTIONS}
                  value={scope}
                  onValueChange={v => setParam(SOURCE_PARAM, v === 'all' ? null : v)}
                  stretch
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Eyebrow as='p'>Сначала</Eyebrow>
                <Segmented
                  options={SORT_OPTIONS}
                  value={sort}
                  onValueChange={v => setParam(SORT_PARAM, v === 'default' ? null : v)}
                  stretch
                />
              </div>
            </>
          }
        />
      </Rise>
      <QueryScreen
        query={catalog}
        isEmpty={data => data.templates.length + data.users.length === 0}
        empty={
          filtered
            ? { title: 'Ничего не нашлось', description: 'Сбрось фильтры или собери программу сам.', action: resetAction }
            : {
                title: 'Каталог пока пуст',
                description: 'Собери программу с нуля.',
                action: (
                  <Button
                    size='sm'
                    disabled={blank.isPending}
                    onClick={() => void blank.create()}
                  >
                    Собрать свою
                    <ArrowRightIcon />
                  </Button>
                ),
              }
        }
      >
        {data =>
          filtered ? (
            <Rise className='px-gutter flex flex-col gap-5'>
              <div className='flex items-baseline justify-between gap-3'>
                <Poster
                  as='h2'
                  size='lg'
                >
                  {sort === 'popular' ? 'Рейтинг' : 'Нашлось'}
                </Poster>
                <Eyebrow>{pluralize(list.length, PROGRAM_FORMS)}</Eyebrow>
              </div>
              {list.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                />
              ))}
            </Rise>
          ) : (
            <CatalogShowcase
              data={data}
              onShowCommunity={() => setParam(SOURCE_PARAM, 'users')}
              onShowPopular={() => setParam(SORT_PARAM, 'popular')}
            />
          )
        }
      </QueryScreen>
    </Screen>
  )
}

export default TemplatesPage
