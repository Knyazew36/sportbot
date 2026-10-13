import { Outlet, useLocation } from 'react-router'

import { cn } from '@/shared/lib/utils'
import { ScreenChromeProvider } from '@/shared/ui/kit/screen-chrome'

import { BottomNav } from './BottomNav'
import { isFocusRoute } from './nav'

// Оболочка Mini App: телефонная колонка на бумаге с зерном, экран и нижнее меню
export const MiniAppShell = ({ isAdmin = false, className }: { isAdmin?: boolean; className?: string }) => {
  const { pathname } = useLocation()
  const navVisible = !isFocusRoute(pathname)

  return (
    <div
      className={cn(
        'sb bg-background text-foreground relative mx-auto flex min-h-svh w-full max-w-[440px] flex-col',
        className,
      )}
    >
      {/* Зерно бумаги */}
      <div className='sb-grain pointer-events-none fixed inset-0 z-50 mx-auto max-w-[440px] opacity-[0.07] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen' />
      <ScreenChromeProvider value={{ navVisible }}>
        <div className='flex flex-1 flex-col'>
          <Outlet />
        </div>
      </ScreenChromeProvider>
      {navVisible && <BottomNav isAdmin={isAdmin} />}
    </div>
  )
}
