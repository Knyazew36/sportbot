import { Link } from 'react-router'

import { useModerationQueue } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Badge } from '@/shared/ui/shadcn/badge'

// Очередь заявок на модерацию: автор, запись, сколько похожих в справочнике (frontend-tz, 14.3)
export const ModerationTab = () => {
  const queue = useModerationQueue()

  return (
    <Rise className='px-gutter flex flex-col gap-3'>
      <QueryScreen
        query={queue}
        className=''
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{ title: 'Очередь пуста', description: 'Новые заявки придут сюда и сообщением от бота.' }}
      >
        {data => (
          <List>
            {data.pages
              .flatMap(page => page.items ?? [])
              .map((r, i) => (
                <ListRow
                  key={r.id}
                  lead={String(i + 1).padStart(2, '0')}
                  className='relative'
                  title={
                    <Link
                      to={buildPath(ROUTES.ADMIN_REQUEST, { requestId: r.id })}
                      className='underline-offset-4 after:absolute after:inset-0 hover:underline'
                    >
                      {r.entry?.name ?? 'Запись удалена'}
                    </Link>
                  }
                  meta={`от ${r.author ?? 'удалённого пользователя'} · ${formatDate(r.createdAt, 'd MMM')}`}
                >
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    <Badge variant='secondary'>{r.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
                    {r.similar.length > 0 && <Badge variant='outline'>похожих: {r.similar.length}</Badge>}
                    {!r.entry?.text && <Badge variant='outline'>без описания</Badge>}
                  </div>
                </ListRow>
              ))}
          </List>
        )}
      </QueryScreen>
      <LoadMore query={queue} />
    </Rise>
  )
}
