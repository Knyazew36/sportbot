import { NavLink, useLocation, useNavigate } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

export type TabDef = { value: string; label: string; to: string; count?: number; attention?: boolean }

type ResponsiveTabsProps = {
  tabs: TabDef[]
  value: string
  label: string
  className?: string
}

// Вкладки записи — это маршруты (:tab в URL), поэтому ссылки, а не локальное состояние.
// На мобильном 6–9 вкладок не помещаются: показываем select с тем же набором
export const ResponsiveTabs = ({ tabs, value, label, className }: ResponsiveTabsProps) => {
  const navigate = useNavigate()
  const { search } = useLocation()
  const items = tabs.map((tab) => ({ value: tab.value, label: tab.label }))

  return (
    <div className={className}>
      <nav aria-label={label} className="hidden md:block">
        <ul className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1">
          {tabs.map((tab) => (
            <li key={tab.value} className="shrink-0">
              <NavLink
                to={tab.to + search}
                replace
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full px-4 text-body-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
                  tab.value === value ? 'bg-foreground text-background' : 'text-slate hover:bg-mist hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={cn(
                      'mono-label rounded-full px-1.5 py-0.5',
                      tab.attention ? 'bg-attention text-black' : tab.value === value ? 'bg-background/15' : 'bg-mist',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="md:hidden">
        <Select
          items={items}
          value={value}
          onValueChange={(next) => {
            const tab = tabs.find((item) => item.value === next)
            if (tab) navigate(tab.to + search, { replace: true })
          }}
        >
          <SelectTrigger aria-label={label} className="w-full bg-card">
            <span className="mono-label text-smoke">{label}</span>
            <SelectValue className="font-medium" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
