import { Link, useLocation } from 'react-router'

import { useAbility, useCurrentOrganization } from '@/entities/session'
import { APP_NAME } from '@/shared/config/app'
import { ROUTES } from '@/shared/config/paths'
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
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'

import { navFor, navHref, type NavItem } from './nav'
import { OrgSwitcher } from './OrgSwitcher'

const NavLinks = ({ items, orgId }: { items: NavItem[]; orgId: number }) => {
  const { pathname } = useLocation()

  return (
    <SidebarMenu className='gap-0.5'>
      {items.map(item => {
        const href = navHref(item, orgId)
        return (
          <SidebarMenuItem key={item.key}>
            {/* Активен и вложенный маршрут раздела */}
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(href)}
            >
              <Link to={href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export const AppSidebar = () => {
  const { orgId } = useCurrentOrganization()
  const nav = navFor(useAbility())

  return (
    <Sidebar
      variant='floating'
      collapsible='offcanvas'
    >
      <SidebarHeader className='gap-5 p-4 pb-2'>
        <Link
          to={ROUTES.HOME}
          className='flex items-baseline gap-2 px-2 pt-1'
        >
          <span className='section-heading text-subheading-lg font-medium tracking-tight'>{APP_NAME}</span>
        </Link>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavLinks
              items={nav.main}
              orgId={orgId}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        {nav.admin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Управление</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavLinks
                items={nav.admin}
                orgId={orgId}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className='flex-row items-center justify-end p-4 pt-2'>
        <ThemeTogglerButton
          variant='ghost'
          className='size-10 rounded-full'
          aria-label='Сменить тему'
        />
      </SidebarFooter>
    </Sidebar>
  )
}
