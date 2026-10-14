import { ArrowUpRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { MODERATION_LABEL, type ModerationOutcome, type MyEntry, useDraftLimit, useMyEntries } from '@/entities/catalog'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

import { NewEntryLinks } from './NewEntryLinks'

const OUTCOME_TONE: Record<ModerationOutcome, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'default',
  APPROVED_EDITED: 'default',
  DUPLICATE: 'secondary',
  REJECTED: 'destructive',
}

const entryPath = (e: MyEntry) => {
  if (e.entryId == null) return null
  return e.kind === 'exercise'
    ? buildPath(ROUTES.EXERCISE, { exerciseId: e.entryId })
    : buildPath(ROUTES.STRETCH, { stretchId: e.entryId })
}

const LINK_LABEL: Partial<Record<ModerationOutcome, string>> = {
  PENDING: 'Открыть черновик',
  REJECTED: 'Открыть черновик',
  DUPLICATE: 'Заменён записью справочника',
}

// Вкладка «Мои»: свои записи со статусом модерации (frontend-tz, 11.5)
export const MineTab = () => {
  const entries = useMyEntries()
  const limit = useDraftLimit()

  return (
    <Rise className='flex flex-col gap-4 px-gutter'>
      <QueryScreen
        query={entries}
        className=''
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{
          title: 'Своих записей нет',
          description: 'Не нашёл упражнение или растяжку в справочнике — добавь своё.',
          action: <NewEntryLinks />,
        }}
      >
        {data => (
          <>
            <List>
              {data.pages
                .flatMap(page => page.items ?? [])
                .map(e => {
                  const path = entryPath(e)
                  return (
                    <ListRow
                      key={e.id}
                      title={e.name}
                      meta={`${e.kind === 'exercise' ? 'Упражнение' : 'Растяжка'} · ${formatDate(e.createdAt, 'd MMMM')}`}
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
                      {path && (
                        <Link
                          to={path}
                          className='text-primary mt-2 inline-flex items-center gap-1 text-[14px] underline-offset-4 hover:underline'
                        >
                          {LINK_LABEL[e.outcome] ?? 'Запись в справочнике'}
                          <ArrowUpRightIcon className='size-3.5' />
                        </Link>
                      )}
                    </ListRow>
                  )
                })}
            </List>
            <LoadMore query={entries} />
          </>
        )}
      </QueryScreen>
      {limit.data && (
        <Text
          size='xs'
          tone='muted'
        >
          Заявок сегодня: {limit.data.limit - limit.data.left} из {limit.data.limit}
        </Text>
      )}
    </Rise>
  )
}
