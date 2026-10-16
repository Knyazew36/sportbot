import { ArrowRightIcon, RotateCcwIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import {
  type CatalogSource,
  SEARCH_PARAM,
  selectedTagIds,
  selectionFromParams,
  SOURCE_PARAM,
  type TagSelection,
  useTemplates,
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
import { Lead } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TemplateFilter } from '@/widgets/template-filter/TemplateFilter'

import { TemplateCard } from './components/TemplateCard'

const SOURCE_TABS: { value: CatalogSource; label: string }[] = [
  { value: 'templates', label: 'Программы' },
  { value: 'users', label: 'Программы пользователей' },
]

// Каталог программ: подбор под себя по группам тегов и поиску, «Взять» — копия у себя (frontend-tz, 10.2).
// Второй таб — программы, которые опубликовали пользователи: пока без фильтров, новые сверху
const TemplatesPage = () => {
  const groups = useTemplateTagGroups()
  const blank = useCreateBlankProgram()
  // Фильтры и таб в ссылке: выборку можно переслать и вернуть кнопкой «назад»
  const [params, setParams] = useSearchParams()
  const source: CatalogSource = params.get(SOURCE_PARAM) === 'users' ? 'users' : 'templates'
  const users = source === 'users'
  const selection = users ? {} : selectionFromParams(groups.data ?? [], params)
  const [query, setQuery] = useState(params.get(SEARCH_PARAM) ?? '')
  const debounced = useDebouncedValue(query.trim())
  const search = users ? '' : debounced
  const filtered = Object.keys(selection).length > 0 || search !== ''
  const templates = useTemplates({ source, tagIds: selectedTagIds(groups.data ?? [], selection), search })

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

  const select = (next: TagSelection) =>
    setParams(search ? { ...next, [SEARCH_PARAM]: search } : next, { replace: true })

  const reset = () => {
    setQuery('')
    setParams({}, { replace: true })
  }

  // Смена таба сбрасывает фильтры: у программ пользователей их пока нет
  const switchSource = (next: CatalogSource) => {
    setQuery('')
    setParams(next === 'users' ? { [SOURCE_PARAM]: next } : {}, { replace: true })
  }

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title='Каталог'
          subtitle={
            templates.data ? pluralize(templates.data.length, ['программа', 'программы', 'программ']) : undefined
          }
        />
      }
      className='px-gutter gap-4'
    >
      <Rise className='-mx-gutter px-gutter no-scrollbar overflow-x-auto'>
        <Segmented
          options={SOURCE_TABS}
          value={source}
          onValueChange={switchSource}
          className='w-max'
        />
      </Rise>
      <Rise>
        <Lead>{users ? 'собрали другие — бери и правь под себя' : 'подбери под себя'}</Lead>
      </Rise>
      {!users && (
        <Rise>
          <TemplateFilter
            groups={groups.data ?? []}
            selection={selection}
            onSelectionChange={select}
            search={query}
            onSearchChange={setQuery}
          />
        </Rise>
      )}
      <QueryScreen
        query={templates}
        className=''
        isEmpty={list => list.length === 0}
        empty={
          users
            ? {
                title: 'Пока пусто',
                description: 'Опубликуй свою программу: в её редакторе — блок «Каталог».',
              }
            : filtered
              ? {
                  title: 'Ничего не нашлось',
                  description: 'Сбрось фильтры или собери программу сам.',
                  action: (
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
                  ),
                }
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
        {list =>
          list.map((t, i) => (
            <TemplateCard
              key={t.id}
              template={t}
              index={i}
              source={source}
            />
          ))
        }
      </QueryScreen>
    </Screen>
  )
}

export default TemplatesPage
