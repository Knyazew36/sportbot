import { ArrowRightIcon, RotateCcwIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import {
  SEARCH_PARAM,
  selectedTagIds,
  selectionFromParams,
  type TagSelection,
  useTemplates,
  useTemplateTagGroups,
} from '@/entities/program'
import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram'
import { ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Lead } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TemplateFilter } from '@/widgets/template-filter/TemplateFilter'

import { TemplateCard } from './components/TemplateCard'

// Каталог программ: подбор под себя по группам тегов и поиску, «Взять» — копия у себя (frontend-tz, 10.2)
const TemplatesPage = () => {
  const groups = useTemplateTagGroups()
  const blank = useCreateBlankProgram()
  // Фильтры в ссылке: выборку можно переслать и вернуть кнопкой «назад»
  const [params, setParams] = useSearchParams()
  const selection = selectionFromParams(groups.data ?? [], params)
  const [query, setQuery] = useState(params.get(SEARCH_PARAM) ?? '')
  const search = useDebouncedValue(query.trim())
  const filtered = Object.keys(selection).length > 0 || search !== ''
  const templates = useTemplates({ tagIds: selectedTagIds(groups.data ?? [], selection), search })

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
      <Rise>
        <Lead>подбери под себя</Lead>
      </Rise>
      <Rise>
        <TemplateFilter
          groups={groups.data ?? []}
          selection={selection}
          onSelectionChange={select}
          search={query}
          onSearchChange={setQuery}
        />
      </Rise>
      <QueryScreen
        query={templates}
        className=''
        isEmpty={list => list.length === 0}
        empty={
          filtered
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
            />
          ))
        }
      </QueryScreen>
    </Screen>
  )
}

export default TemplatesPage
