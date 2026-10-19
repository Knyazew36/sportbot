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

// Нижнее меню: «Сегодня» — плитка с датой по центру, остальные разделы делятся по бокам.
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

// Плитка «Сегодня»: вместо иконки — сегодняшнее число, кнопка буквально про этот день.
// Выступает над меню на --sb-nav-rise и, как все кнопки, садится на жёсткую тень при нажатии.
// Дата берётся при отрисовке: меню перерисовывается на каждом переходе, после полуночи догонит с первым же тапом
const HeroLink = ({ item, badge }: { item: NavItem; badge?: number }) => {
  const now = new Date()
  const weekday = now.toLocaleDateString('ru-RU', { weekday: 'short' })
  return (
    <NavLink
      to={item.to}
      aria-label={item.label}
      onClick={tapIfNew}
      // Подпись на одной линии с боковыми, отступ от плитки больше её тени — иначе тень наползает на текст
      className='group/hero relative flex h-16 flex-col items-center justify-end gap-1.5 pb-2.5 outline-none'
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className='relative -mt-(--sb-nav-rise) size-14'
          >
            {/* Растр печатного плаката проступает за активной плиткой, как оттиск */}
            <span
              className={cn(
                'sb-halftone absolute -inset-[18px] [mask-image:radial-gradient(closest-side,black_62%,transparent)] transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                isActive ? 'scale-100 opacity-70' : 'scale-75 opacity-0',
              )}
            />
            <span
              className={cn(
                'border-foreground relative flex size-full flex-col items-center justify-center gap-0.5 border-[1.5px] shadow-[3px_3px_0_var(--sb-ink)] transition-[translate,box-shadow,background-color,color] duration-100 group-focus-visible/hero:ring-4 group-focus-visible/hero:ring-ring/25 group-active/hero:translate-[3px] group-active/hero:shadow-none',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground',
              )}
            >
              <span className='sb-label text-[9px] leading-none tracking-[0.18em]'>{weekday}</span>
              <span className='sb-poster text-[27px] tabular-nums'>{now.getDate()}</span>
            </span>
            <Badge count={badge} />
          </span>
          {/* Ярлык-наклейка под плиткой: плакатная плашка с лёгким перекосом, как наклеенная от руки */}
          <span
            className={cn(
              'sb-poster relative flex h-4 -rotate-2 items-center px-1.5 pt-px text-[12px] tracking-[0.06em] whitespace-nowrap transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}
