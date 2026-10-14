import { Outlet, useLocation, useNavigate } from 'react-router'

import { useEffect } from 'react'

import { cn } from '@/shared/lib/utils'
import { showBackButton } from '@/shared/miniapp'
import { ScreenChromeProvider } from '@/shared/ui/kit/screen-chrome'

import { BottomNav } from './BottomNav'
import { isFocusRoute, isSectionRoot, type ShellNav } from './nav'

type MiniAppShellProps = { nav: ShellNav; isAdmin?: boolean; className?: string }

// Оболочка Mini App: телефонная колонка на бумаге с зерном, экран и нижнее меню
export const MiniAppShell = ({ nav, isAdmin = false, className }: MiniAppShellProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navVisible = !isFocusRoute(nav, pathname)
  const sectionRoot = isSectionRoot(nav, pathname)

  // Системная «Назад» мессенджера — шаг назад внутри приложения (frontend-tz, раздел 6). На корне раздела её нет
  useEffect(() => {
    if (sectionRoot) return
    const hide = showBackButton(() => navigate(-1))
    return hide || undefined
  }, [sectionRoot, navigate])

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
      {navVisible && (
        <BottomNav
          nav={nav.items}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
