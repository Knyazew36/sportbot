import { NavLink } from 'react-router'

import { cn } from '@/shared/lib/utils'

import type { NavItem } from './nav'

// Нижнее меню: активный раздел отмечен отрезком беговой дорожки сверху. У администратора шестой пункт
export const BottomNav = ({ nav, isAdmin }: { nav: NavItem[]; isAdmin: boolean }) => {
  const items = nav.filter(item => isAdmin || !item.adminOnly)
  return (
    <nav
      aria-label='Разделы'
      className={cn(
        'border-border bg-background/85 sticky bottom-0 z-30 grid border-t-[1.5px] px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl',
        items.length > 5 ? 'grid-cols-6' : 'grid-cols-5',
      )}
    >
      {items.map(item => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'relative flex h-16 flex-col items-center justify-center gap-1.5 transition-colors',
              isActive ? 'text-primary' : 'text-foreground/50 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'bg-primary absolute -top-[1.5px] h-[3px] rounded-full transition-all duration-300',
                  isActive ? 'w-10' : 'w-0',
                )}
              />
              <item.icon
                className='size-[22px]'
                strokeWidth={isActive ? 2.2 : 1.6}
                aria-hidden
              />
              {/* В шесть колонок «Справочник» на 320px помещается только мельче */}
              <span
                className={cn(
                  'leading-none whitespace-nowrap',
                  items.length > 5 ? 'text-[min(10.5px,2.75vw)]' : 'text-[min(10.5px,3.1vw)]',
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
