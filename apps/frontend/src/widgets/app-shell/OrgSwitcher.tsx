import { CheckIcon, ChevronsUpDownIcon, LayoutGridIcon } from 'lucide-react'
import { Link } from 'react-router'

import { ORG_ROLE_LABEL, useCurrentOrganization, useMe } from '@/entities/session'
import { buildPath, ROUTES } from '@/shared/config/paths'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'

// Переключатель рабочей организации: список берётся из /user/me
export const OrgSwitcher = () => {
  const { data: me } = useMe()
  const { orgId, organization, role } = useCurrentOrganization()
  const organizations = me?.organizations ?? []
  const name = organization?.name ?? `Организация #${orgId}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='bg-mist hover:bg-ash/40 focus-visible:ring-ring/30 data-popup-open:bg-ash/40 flex w-full items-center gap-3 rounded-3xl p-2 pr-3 text-left transition-colors outline-none focus-visible:ring-3'>
        <span className='bg-foreground text-body text-background flex size-10 shrink-0 items-center justify-center rounded-2xl font-medium'>
          {name[0]?.toUpperCase()}
        </span>
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='text-body-sm truncate font-medium'>{name}</span>
          {role && <span className='mono-label text-smoke truncate'>{ORG_ROLE_LABEL[role]}</span>}
        </span>
        <ChevronsUpDownIcon
          className='text-smoke size-4 shrink-0'
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        sideOffset={8}
        className='w-64'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className='mono-label text-smoke'>Рабочая организация</DropdownMenuLabel>
          {organizations.map(item => (
            <DropdownMenuItem
              key={item.id}
              render={<Link to={buildPath(ROUTES.DASHBOARD, { orgId: item.id })} />}
            >
              <span className='bg-mist text-caption flex size-7 items-center justify-center rounded-lg font-medium'>
                {item.name[0]?.toUpperCase()}
              </span>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate'>{item.name}</span>
                <span className='mono-label text-smoke'>{ORG_ROLE_LABEL[item.role]}</span>
              </span>
              {item.id === orgId && <CheckIcon className='ml-auto' />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className='bg-mist' />
        <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
          <LayoutGridIcon /> Все рабочие области
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
