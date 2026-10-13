import { Link } from 'react-router'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Badge } from '@/shared/ui/shadcn/badge'

import { moderationQueue } from '../../model/admin'

// Очередь заявок на модерацию: автор, запись, сколько похожих в справочнике (frontend-tz, 14.3)
export const ModerationTab = () => (
  <Rise className='px-5'>
    {moderationQueue.length === 0 ? (
      <ScreenState
        state='empty'
        title='Очередь пуста'
        description='Новые заявки придут сюда и сообщением от бота.'
      />
    ) : (
      <List>
        {moderationQueue.map((r, i) => (
          <ListRow
            key={r.id}
            lead={String(i + 1).padStart(2, '0')}
            className='relative'
            title={
              <Link
                to={buildPath(ROUTES.PREVIEW_ADMIN_MODERATION, { requestId: r.id })}
                className='underline-offset-4 after:absolute after:inset-0 hover:underline'
              >
                {r.name}
              </Link>
            }
            meta={`от ${r.author} · ${r.createdAt}`}
          >
            <div className='mt-2 flex flex-wrap gap-1.5'>
              <Badge variant='secondary'>{r.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
              {r.similarIds.length > 0 && <Badge variant='outline'>похожих: {r.similarIds.length}</Badge>}
              {!r.text && <Badge variant='outline'>без описания</Badge>}
            </div>
          </ListRow>
        ))}
      </List>
    )}
  </Rise>
)
