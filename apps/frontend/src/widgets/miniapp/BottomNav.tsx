import { NavLink } from 'react-router'

import type { MouseEvent } from 'react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

import type { NavBadges, NavItem } from './nav'

// selectionChanged в Telegram почти не ощущается, поэтому толчок; по уже открытому разделу — без вибрации
const tapIfNew = (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.currentTarget.getAttribute('aria-current') !== 'page') haptic.tap()
}

const Badge = ({ count }: { count?: number }) =>
  !!count && (
    <span
      aria-label={`ждут: ${count}`}
      className='bg-primary text-primary-foreground border-background absolute -top-1.5 left-[calc(100%-8px)] z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[10px] leading-none font-semibold tabular-nums'
    >
      {count > 99 ? '99+' : count}
    </span>
  )

// Нижнее меню: «Сегодня» — число дня по центру, остальные разделы делятся по бокам.
// Активный боковой раздел отмечен отрезком беговой дорожки сверху. У администратора шестой пункт уходит вправо
export const BottomNav = ({ nav, isAdmin, badges }: { nav: NavItem[]; isAdmin: boolean; badges?: NavBadges }) => {
  const items = nav.filter(item => isAdmin || !item.adminOnly)
  const hero = items.find(item => item.hero)
  const rest = items.filter(item => item !== hero)
  const left = hero ? rest.slice(0, Math.floor(rest.length / 2)) : rest
  const right = hero ? rest.slice(left.length) : []

  return (
    <nav
      aria-label='Разделы'
      className='border-border bg-background/85 backdrop-blur-glass sticky bottom-0 z-30 grid grid-cols-[1fr_76px_1fr] border-t-[1.5px] px-1 pb-[max(0.5rem,var(--sb-bottom-inset))]'
    >
      <SideGroup
        items={left}
        badges={badges}
      />
      {hero && (
        <HeroLink
          item={hero}
          badge={badges?.[hero.to]}
        />
      )}
      <SideGroup
        items={right}
        badges={badges}
      />
    </nav>
  )
}

const SideGroup = ({ items, badges }: { items: NavItem[]; badges?: NavBadges }) => (
  <div
    className='grid'
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map(item => (
      <NavLink
        key={item.label}
        to={item.to}
        onClick={tapIfNew}
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
            <span className='relative'>
              <item.icon
                className='size-[22px]'
                strokeWidth={isActive ? 2.2 : 1.6}
                aria-hidden
              />
              <Badge count={badges?.[item.to]} />
            </span>
            {/* Три пункта на половине ширины («Справочник», «Статистика») на 375px помещаются только мельче */}
            <span
              className={cn(
                'leading-none whitespace-nowrap',
                items.length > 2 ? 'text-[min(10.5px,2.6vw)]' : 'text-[min(10.5px,3.1vw)]',
              )}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    ))}
  </div>
)

// «Сегодня»: вместо иконки — сегодняшнее число плакатным шрифтом, кнопка буквально про этот день.
// Не выступает над меню: выпуклым на экране остаётся только главное действие над ним, иначе они спорят.
// Открытый раздел — дорожка сверху, как у боковых, и растр печатного плаката: под цифрой пусто,
// растр расходится от неё кольцом. Дата берётся при отрисовке: меню перерисовывается на каждом переходе
const HeroLink = ({ item, badge }: { item: NavItem; badge?: number }) => {
  const day = new Date().getDate()
  return (
    <NavLink
      to={item.to}
      aria-label={item.label}
      onClick={tapIfNew}
      className={({ isActive }) =>
        cn(
          'relative flex h-16 flex-col items-center justify-end gap-0.5 pb-1.5 transition-colors',
          isActive ? 'text-primary' : 'text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'bg-primary absolute -top-[1.5px] h-[3px] rounded-full transition-all duration-300',
              isActive ? 'w-12' : 'w-0',
            )}
          />
          <span
            aria-hidden
            className='relative flex h-10 w-16 items-center justify-center'
          >
            <span
              className={cn(
                'sb-halftone absolute -inset-x-[16px] -inset-y-[12px] [mask-image:radial-gradient(closest-side,transparent_42%,black_62%,transparent)] transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                isActive ? 'scale-100 opacity-80' : 'scale-75 opacity-0',
              )}
            />
            <span className='sb-poster relative pt-1 text-[30px] leading-none tabular-nums'>{day}</span>
            <Badge count={badge} />
          </span>
          <span
            className={cn(
              'sb-poster text-[13px] leading-none tracking-[0.06em] whitespace-nowrap',
              !isActive && 'text-foreground/70',
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}
