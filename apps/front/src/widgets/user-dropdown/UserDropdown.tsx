import {
  BellIcon,
  BuildingIcon,
  ChevronDownIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, ROUTES, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { useDemoState, type DemoRole } from '@/shared/mock/state'
import { PersonAvatar } from '@/shared/ui/rb/PersonAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'

const THEMES = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
  { value: 'system', label: 'Как в системе', icon: MonitorIcon },
] as const

// Макетные данные: заменятся ответом API профиля
const USERS: Record<DemoRole, { name: string; role: string }> = {
  owner: { name: 'Анна Волкова', role: 'Владелец' },
  manager: { name: 'Игорь Петров', role: 'Управляющий' },
  employee: { name: 'Марина Соколова', role: 'Сотрудник' },
}
const ORG_NAME = 'Волна'

type UserDropdownProps = {
  // compact — только аватар (мобильная шапка), иначе аватар + имя + роль
  compact?: boolean
  className?: string
}

// Меню профиля в шапке: личные переходы, смена рабочей области и тема; рабочие разделы живут в навигации
export const UserDropdown = ({ compact, className }: UserDropdownProps) => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const { role, isEmployee } = useDemoState()
  const { theme = 'system', setTheme } = useTheme()
  const user = USERS[role]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group/user flex items-center gap-2.5 rounded-full p-1 text-left outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-mist',
          !compact && 'pr-3',
          className,
        )}
        aria-label={`Профиль: ${user.name}`}
      >
        <PersonAvatar name={user.name} size="sm" tone="accent" />
        {!compact && (
          <>
            <span className="hidden min-w-0 flex-col lg:flex">
              <span className="truncate text-body-sm font-medium leading-tight">{user.name}</span>
              <span className="mono-label truncate text-smoke">{user.role}</span>
            </span>
            <ChevronDownIcon
              className="size-4 text-smoke transition-transform group-data-popup-open/user:rotate-180"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-3 py-3">
            <PersonAvatar name={user.name} size="lg" tone="accent" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body font-medium text-foreground">{user.name}</span>
              <span className="mono-label truncate text-smoke">
                {user.role} · {ORG_NAME}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={to.profile(orgId)} />}>
            <UserIcon /> Профиль
          </DropdownMenuItem>
          {!isEmployee && (
            <DropdownMenuItem render={<Link to={to.settings('notifications', orgId)} />}>
              <BellIcon /> Уведомления и MAX
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link to={ROUTES.WORKSPACES} />}>
            <BuildingIcon /> Сменить организацию
          </DropdownMenuItem>
          {/* Гостевой кабинет — отдельный контур, переход в него явный (§2) */}
          <DropdownMenuItem render={<Link to={to.guestBookings()} />}>
            <UsersIcon /> Мои поездки как гость
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to={to.help(orgId)} />}>
            <LifeBuoyIcon /> Помощь
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="mono-label text-smoke">Тема</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as string)}>
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-mist" />

        <DropdownMenuItem variant="destructive" render={<Link to={ROUTES.LOGIN} />}>
          <LogOutIcon /> Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
