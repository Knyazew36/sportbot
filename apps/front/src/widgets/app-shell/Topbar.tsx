import { Link, useSearchParams } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { useDemoState } from '@/shared/mock/state'
import { SidebarTrigger } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { UserDropdown } from '@/widgets/user-dropdown/UserDropdown'
import { NotificationsPopover } from './NotificationsPopover'

// Макетный список объектов для фильтра в шапке
const OBJECTS = [
  { value: 'all', label: 'Все объекты' },
  { value: 'p-ligovsky', label: 'Студия на Лиговском' },
  { value: 'p-neva', label: 'Лофт у Невы' },
  { value: 'p-moika', label: 'Апартаменты на Мойке' },
  { value: 'p-repino', label: 'Дом в Репино' },
]

// Фильтр объекта хранится в ссылке, как и остальные фильтры (§4.2)
const ObjectFilter = () => {
  const [params, setParams] = useSearchParams()
  const value = params.get('object') ?? 'all'

  return (
    <Select
      items={OBJECTS}
      value={value}
      onValueChange={(next) =>
        setParams(
          (prev) => {
            const nextParams = new URLSearchParams(prev)
            if (next === 'all') nextParams.delete('object')
            else nextParams.set('object', next as string)
            return nextParams
          },
          { replace: true },
        )
      }
    >
      <SelectTrigger aria-label="Объект" className="w-56 rounded-full bg-card">
        <span className="mono-label text-smoke">Объект</span>
        <SelectValue className="truncate font-medium" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {OBJECTS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const Topbar = () => {
  const { isEmployee, singleObject } = useDemoState()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-background/85 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
      <SidebarTrigger className="hidden size-11 rounded-full bg-card md:flex" aria-label="Свернуть меню" />
      <Link to={ROUTES.PAGES} className="section-heading flex items-center gap-1.5 text-subheading-lg font-medium md:hidden">
        Rentybot
        <span className="size-2 rounded-full bg-success" aria-hidden />
      </Link>
      {/* С одним объектом выбирать нечего — фильтр не показываем (§2) */}
      {!isEmployee && !singleObject && (
        <div className="hidden md:block">
          <ObjectFilter />
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover />
        <UserDropdown className="bg-card" />
      </div>
    </header>
  )
}
