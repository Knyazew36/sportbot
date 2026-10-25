import { BellIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useUnreadCount } from '@sportbot/api/entities/notification/api'
import { useCurrentOrganization } from '@/shared/auth/ability'
import { buildPath, ROUTES } from '@/shared/config/paths'

// Колокольчик в шапке: счётчик непрочитанных, по клику — лента уведомлений
export const NotificationsBell = () => {
  const { orgId } = useCurrentOrganization()
  const { data: unread = 0 } = useUnreadCount()

  return (
    <Link
      to={buildPath(ROUTES.NOTIFICATIONS, { orgId })}
      aria-label={`Уведомления, непрочитанных: ${unread}`}
      className='bg-card hover:bg-mist focus-visible:ring-ring/30 relative flex size-11 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3'
    >
      <BellIcon
        className='size-5'
        aria-hidden
      />
      {unread > 0 && (
        <span className='mono-label bg-attention absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-black'>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
