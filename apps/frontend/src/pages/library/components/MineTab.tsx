import { ArrowUpRightIcon, SendIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import {
  type CatalogKind,
  ENTRY_STATE_LABEL,
  type EntryState,
  entryState,
  type MyEntry,
  useMyEntries,
  usePublishEntry,
} from '@sportbot/api/entities/catalog'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const KIND_OPTIONS = [
  { value: 'exercise', label: 'Упражнения' },
  { value: 'stretch', label: 'Растяжки' },
] as const

const STATE_HINT: Partial<Record<EntryState, string>> = {
  PRIVATE: 'видна только тебе',
  PENDING: 'ждёт администратора',
  UNPUBLISHED: 'у тебя остаётся',
}

// Опубликовать можно личную, отклонённую и снятую — заявка уходит заново
const CAN_PUBLISH: EntryState[] = ['PRIVATE', 'REJECTED', 'UNPUBLISHED']

const entryPath = (e: MyEntry) =>
  e.kind === 'exercise'
    ? buildPath(ROUTES.EXERCISE, { exerciseId: e.id })
    : buildPath(ROUTES.STRETCH, { stretchId: e.id })

// Вкладка «Мои»: свои записи и их публикация в общий справочник (frontend-tz, 11.5)
export const MineTab = () => {
  const [kind, setKind] = useState<CatalogKind>('exercise')
  const entries = useMyEntries(kind)
  const publish = usePublishEntry()

  return (
    <Rise className='px-gutter flex flex-col gap-4'>
      <Segmented
        options={KIND_OPTIONS}
        value={kind}
        onValueChange={setKind}
        stretch
      />
      <QueryScreen
        query={entries}
        className=''
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{
          title: kind === 'exercise' ? 'Своих упражнений нет' : 'Своих растяжек нет',
          // Кнопки добавления — в подвале вкладки, здесь их не дублируем
          description: 'Не нашёл нужное в справочнике — добавь своё кнопками ниже. Оно сразу доступно тебе.',
        }}
      >
        {data => (
          <>
            <List>
              {data.pages
                .flatMap(page => page.items ?? [])
                .map(e => {
                  const state = entryState(e)
                  const hint = STATE_HINT[state]
                  return (
                    <ListRow
                      key={e.id}
                      title={e.name}
                      meta={`${ENTRY_STATE_LABEL[state]}${hint ? ` · ${hint}` : ''} · ${formatDate(e.createdAt, 'd MMMM')}`}
                    >
                      {e.reason && state !== 'PUBLISHED' && (
                        <Text
                          size='sm'
                          tone='soft'
                          className='mt-2'
                        >
                          «{e.reason}»
                        </Text>
                      )}
                      <div className='mt-2 flex flex-wrap items-center gap-3'>
                        <Link
                          to={entryPath(e)}
                          className='text-primary inline-flex items-center gap-1 text-[14px] underline-offset-4 hover:underline'
                        >
                          Открыть
                          <ArrowUpRightIcon className='size-3.5' />
                        </Link>
                        {CAN_PUBLISH.includes(state) && (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={publish.isPending}
                            onClick={() => publish.mutate({ kind: e.kind, id: e.id })}
                          >
                            <SendIcon />
                            Опубликовать
                          </Button>
                        )}
                      </div>
                    </ListRow>
                  )
                })}
            </List>
            <LoadMore query={entries} />
          </>
        )}
      </QueryScreen>
    </Rise>
  )
}
