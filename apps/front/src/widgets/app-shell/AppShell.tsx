import { Outlet } from 'react-router'
import { SidebarInset, SidebarProvider } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { AppFooter } from './AppFooter'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { Topbar } from './Topbar'

// Layout-маршрут рабочего кабинета: /app/:orgId/*
const AppShell = () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset className="min-h-svh bg-background">
      <Topbar />
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 pt-2 md:px-8 md:pt-4">
        <Outlet />
      </div>
      <AppFooter />
    </SidebarInset>
    <MobileNav />
  </SidebarProvider>
)

export default AppShell
