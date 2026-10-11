import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { DEMO_ORG_ID, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState } from '@/shared/mock/state'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'
import { NAV_HELP, navFor, type NavItem } from './nav'

// Макетные организации: заменятся списком рабочих областей из API
const ORGS = [
  { id: 'org-volna', name: 'Волна', role: 'Владелец', objects: 4 },
  { id: 'org-sever', name: 'Север Апартаменты', role: 'Управляющий', objects: 12 },
]

const OrgSwitcher = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const current = ORGS.find((org) => org.id === orgId) ?? ORGS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-3xl bg-mist p-2 pr-3 text-left outline-none transition-colors hover:bg-ash/40 focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-ash/40">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-body font-medium text-background">
          {current.name[0]}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium">{current.name}</span>
          <span className="mono-label truncate text-smoke">
            {current.role} · {current.objects} об.
          </span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-smoke" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="mono-label text-smoke">Рабочая организация</DropdownMenuLabel>
          {ORGS.map((org) => (
            <DropdownMenuItem key={org.id} render={<Link to={`/app/${org.id}/today`} />}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-mist text-caption font-medium">{org.name[0]}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{org.name}</span>
                <span className="mono-label text-smoke">{org.role}</span>
              </span>
              {org.id === current.id && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-mist" />
        <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
          <PlusIcon /> Все рабочие области
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const NavLinks = ({ items, orgId }: { items: NavItem[]; orgId: string }) => {
  const { pathname } = useLocation()
  return (
  <SidebarMenu className="gap-0.5">
    {items.map((item) => (
      <SidebarMenuItem key={item.key}>
        {/* Активен и вложенный маршрут: карточка брони подсвечивает «Брони» */}
        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href(orgId))}>
          <Link to={item.href(orgId)}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {item.badge != null && (
          <SidebarMenuBadge className="mono-label rounded-full bg-attention px-1.5 text-black">{item.badge}</SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
  )
}

export const AppSidebar = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { role } = useDemoState()
  const nav = navFor(role)

  return (
    <Sidebar variant="floating" collapsible="offcanvas">
      <SidebarHeader className="gap-5 p-4 pb-2">
        <Link to={ROUTES.PAGES} className="flex items-baseline gap-2 px-2 pt-1">
          <span className="section-heading text-subheading-lg font-medium tracking-tight">Rentybot</span>
          <span className="size-2 rounded-full bg-success" aria-hidden />
        </Link>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavLinks items={nav.main} orgId={orgId} />
          </SidebarGroupContent>
        </SidebarGroup>
        {nav.settings.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Настройки</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavLinks items={nav.settings} orgId={orgId} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={cn('flex-row items-center gap-1 p-4 pt-2')}>
        <div className="flex-1">
          <NavLinks items={[NAV_HELP]} orgId={orgId} />
        </div>
        <ThemeTogglerButton variant="ghost" className="size-10 rounded-full" aria-label="Сменить тему" />
      </SidebarFooter>
    </Sidebar>
  )
}
