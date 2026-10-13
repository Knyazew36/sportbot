import { ChevronDownIcon, LayoutGridIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon, UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router'

import { logout, ORG_ROLE_LABEL, useCurrentOrganization, useMe } from '@/entities/session'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { displayName } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'

const THEMES = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
  { value: 'system', label: 'Как в системе', icon: MonitorIcon },
] as const

// Меню профиля в шапке: личные переходы, смена рабочей области, тема и выход
export const UserDropdown = ({ className }: { className?: string }) => {
  const { data: me } = useMe()
  const { orgId, organization, role } = useCurrentOrganization()
  const { theme = 'system', setTheme } = useTheme()
  const name = displayName(me)
  const avatar = toAssetUrl(me?.avatarUrl)
  const caption = [role && ORG_ROLE_LABEL[role], organization?.name].filter(Boolean).join(' · ')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group/user hover:bg-mist focus-visible:ring-ring/30 data-popup-open:bg-mist flex items-center gap-2.5 rounded-full p-1 pr-3 text-left transition-colors outline-none focus-visible:ring-3',
          className,
        )}
        aria-label={`Профиль: ${name}`}
      >
        <PersonAvatar
          name={name}
          src={avatar}
          size='sm'
          tone='accent'
        />
        <span className='hidden min-w-0 flex-col lg:flex'>
          <span className='text-body-sm truncate leading-tight font-medium'>{name}</span>
          {caption && <span className='mono-label text-smoke truncate'>{caption}</span>}
        </span>
        <ChevronDownIcon
          className='text-smoke size-4 transition-transform group-data-popup-open/user:rotate-180'
          aria-hidden
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-72'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center gap-3 px-3 py-3'>
            <PersonAvatar
              name={name}
              src={avatar}
              size='lg'
              tone='accent'
            />
            <span className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-body text-foreground truncate font-medium'>{name}</span>
              {me?.email && <span className='mono-label text-smoke truncate'>{me.email}</span>}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='bg-mist' />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={buildPath(ROUTES.PROFILE, { orgId })} />}>
            <UserIcon /> Профиль
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
            <LayoutGridIcon /> Сменить организацию
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='bg-mist' />

        <DropdownMenuGroup>
          <DropdownMenuLabel className='mono-label text-smoke'>Тема</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={value => setTheme(value as string)}
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
              >
                <Icon /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='bg-mist' />

        <DropdownMenuItem
          variant='destructive'
          onClick={logout}
        >
          <LogOutIcon /> Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
