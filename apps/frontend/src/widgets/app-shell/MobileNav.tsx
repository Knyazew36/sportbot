import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useState } from 'react'

import { useAbility, useCurrentOrganization } from '@/entities/session'
import { cn } from '@/shared/lib/utils'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { navFor, navHref, type NavItem } from './nav'

const MoreLink = ({ item, orgId, onClick }: { item: NavItem; orgId: number; onClick: () => void }) => (
  <Link
    to={navHref(item, orgId)}
    onClick={onClick}
    className='hover:bg-mist focus-visible:bg-mist flex items-center gap-3 rounded-3xl p-3 transition-colors focus-visible:outline-none'
  >
    <span className='bg-mist flex size-10 items-center justify-center rounded-full'>
      <item.icon
        className='size-4'
        aria-hidden
      />
    </span>
    <span className='text-body flex-1 font-medium'>{item.label}</span>
    <ChevronRightIcon
      className='text-smoke size-4'
      aria-hidden
    />
  </Link>
)

// Нижнее меню мобильного: основные разделы + «Ещё» с остальным по правам роли.
// Матовая плашка с блюром: контент читается сквозь неё, но не спорит с подписями
export const MobileNav = () => {
  const { orgId } = useCurrentOrganization()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const nav = navFor(useAbility())
  const primary = nav.main.filter(item => item.mobile)
  const rest = [...nav.main.filter(item => !item.mobile), ...nav.admin]
  const moreActive = rest.some(item => pathname.startsWith(navHref(item, orgId)))

  const tabClass = (active: boolean) =>
    cn(
      'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-pill text-[11px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
      active ? 'bg-foreground text-background' : 'text-slate hover:text-foreground',
    )

  return (
    <>
      <nav
        aria-label='Основное меню'
        className='rounded-pill bg-card/70 ring-foreground/5 dark:bg-card/60 fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-1 p-1.5 ring-1 backdrop-blur-xl backdrop-saturate-150 md:hidden'
      >
        {primary.map(item => {
          const href = navHref(item, orgId)
          const active = pathname.startsWith(href)
          return (
            <Link
              key={item.key}
              to={href}
              className={tabClass(active)}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon
                className='size-5'
                aria-hidden
              />
              {item.label}
            </Link>
          )
        })}
        <button
          type='button'
          className={tabClass(moreActive || moreOpen)}
          onClick={() => setMoreOpen(true)}
          aria-haspopup='dialog'
        >
          <MenuIcon
            className='size-5'
            aria-hidden
          />
          Ещё
        </button>
      </nav>

      <Sheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
      >
        <SheetContent
          side='bottom'
          className='max-h-[85svh] gap-0 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]'
        >
          <SheetHeader className='pb-2'>
            <SheetTitle>Ещё</SheetTitle>
            <SheetDescription className='mono-label'>Разделы по вашим правам</SheetDescription>
          </SheetHeader>
          <div className='flex flex-col px-3'>
            {rest.map(item => (
              <MoreLink
                key={item.key}
                item={item}
                orgId={orgId}
                onClick={() => setMoreOpen(false)}
              />
            ))}
          </div>
          <div className='bg-mist mx-6 mt-3 flex items-center justify-between rounded-3xl p-3 pl-4'>
            <span className='text-body-sm font-medium'>Тема оформления</span>
            <ThemeTogglerButton
              variant='ghost'
              className='bg-card size-10 rounded-full'
              aria-label='Сменить тему'
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
