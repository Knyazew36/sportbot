import { CheckCheckIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import {
  type Notification,
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
} from '@/entities/notification/api'
import { formatDateTime } from '@/shared/lib/format'
import { usePageParam } from '@/shared/lib/hooks/use-page-param'
import { notifyError } from '@/shared/lib/notify'
import { cn } from '@/shared/lib/utils'
import { FilterBar, type FilterDef } from '@/shared/ui/kit/FilterBar'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { Pagination } from '@/shared/ui/kit/Pagination'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const FILTERS: FilterDef[] = [
  { key: 'unread', label: 'Показать', options: [{ value: 'true', label: 'Непрочитанные' }] },
]

const NotificationRow = ({ notification }: { notification: Notification }) => {
  const read = useReadNotification()
  const unread = !notification.readAt

  return (
    <li>
      <button
        type='button'
        disabled={!unread || read.isPending}
        onClick={() => read.mutate(notification.id, { onError: notifyError })}
        className='enabled:hover:bg-mist focus-visible:bg-mist flex w-full gap-3 rounded-3xl p-3 text-left transition-colors outline-none'
      >
        <span
          className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-foreground' : 'bg-transparent')}
          aria-label={unread ? 'Не прочитано' : undefined}
        />
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='flex items-baseline justify-between gap-2'>
            <span className={cn('text-body-sm truncate', unread && 'font-medium')}>{notification.title}</span>
            <span className='mono-label text-smoke shrink-0'>{formatDateTime(notification.createdAt)}</span>
          </span>
          <span className='text-body-sm text-slate'>{notification.body}</span>
        </span>
      </button>
    </li>
  )
}

const NotificationsPage = () => {
  const [params] = useSearchParams()
  const [page, setPage] = usePageParam()
  const notifications = useNotifications({ page, filter_unread: params.get('unread') === 'true' || undefined })
  const readAll = useReadAllNotifications()

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        title='Уведомления'
        actions={
          <Button
            variant='secondary'
            disabled={readAll.isPending}
            onClick={() => readAll.mutate(undefined, { onError: notifyError })}
          >
            <CheckCheckIcon /> Прочитать все
          </Button>
        }
      />
      <FilterBar filters={FILTERS} />
      <QueryState
        query={notifications}
        isEmpty={data => data.items.length === 0}
        empty={{ title: 'Уведомлений нет', description: 'Здесь появятся события по вашим организациям.' }}
      >
        {data => (
          <SectionCard>
            <ul className='flex flex-col'>
              {data.items.map(notification => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </ul>
            <Pagination
              meta={data.meta}
              onPageChange={setPage}
              className='mt-4'
            />
          </SectionCard>
        )}
      </QueryState>
    </div>
  )
}

export default NotificationsPage
