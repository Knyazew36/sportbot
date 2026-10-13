import { Link } from 'react-router'

import { APP_NAME } from '@/shared/config/app'
import { ROUTES } from '@/shared/config/paths'
import { SidebarTrigger } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { UserDropdown } from '@/widgets/user-dropdown/UserDropdown'

import { NotificationsBell } from './NotificationsBell'

export const Topbar = () => (
  <header className='bg-background/85 sticky top-0 z-20 flex items-center gap-2 px-4 py-3 backdrop-blur-md md:px-6 md:py-4'>
    <SidebarTrigger
      className='bg-card hidden size-11 rounded-full md:flex'
      aria-label='Свернуть меню'
    />
    <Link
      to={ROUTES.HOME}
      className='section-heading text-subheading-lg font-medium md:hidden'
    >
      {APP_NAME}
    </Link>
    <div className='ml-auto flex items-center gap-2'>
      <NotificationsBell />
      <UserDropdown className='bg-card' />
    </div>
  </header>
)
