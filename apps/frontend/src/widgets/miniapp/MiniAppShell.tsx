import { Outlet, useLocation, useNavigate } from 'react-router'

import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { showBackButton } from '@/shared/miniapp'
import { ScreenChromeProvider } from '@/shared/ui/kit/screen-chrome'

import { BottomNav } from './BottomNav'
import { isFocusRoute, isSectionRoot, type NavBadges, type ShellNav } from './nav'

type MiniAppShellProps = {
  nav: ShellNav
  isAdmin?: boolean
  /** Счётчики на пунктах меню по их `to` */
  badges?: NavBadges
  className?: string
}

// Оболочка Mini App: телефонная колонка на бумаге с зерном, экран и нижнее меню
export const MiniAppShell = ({ nav, isAdmin = false, badges, className }: MiniAppShellProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchFocused, setSearchFocused] = useState(false)
  const navVisible = !isFocusRoute(nav, pathname) && !searchFocused
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
        'sb bg-background text-foreground relative mx-auto flex min-h-svh w-full max-w-[440px] flex-col pt-(--sb-top-inset)',
        className,
      )}
    >
      {/* Полоса под кнопками Telegram в fullscreen: контент уезжает под неё, а не под «Закрыть» */}
      <div className='bg-background fixed inset-x-0 top-0 z-40 mx-auto h-(--sb-top-inset) max-w-[440px]' />
      {/* Зерно бумаги */}
      <div className='sb-grain pointer-events-none fixed inset-0 z-50 mx-auto max-w-[440px] opacity-[0.07] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen' />
      <ScreenChromeProvider value={{ navVisible, setSearchFocused }}>
        <div className='flex flex-1 flex-col'>
          <Outlet />
        </div>
      </ScreenChromeProvider>
      {navVisible && (
        <BottomNav
          nav={nav.items}
          isAdmin={isAdmin}
          badges={badges}
        />
      )}
    </div>
  )
}
