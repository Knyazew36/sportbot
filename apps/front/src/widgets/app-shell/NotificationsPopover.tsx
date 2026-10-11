import { BellIcon, CircleAlertIcon, ClipboardCheckIcon, MessageSquareWarningIcon, WalletIcon, type LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, to } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover'

type Notice = {
  id: string
  icon: LucideIcon
  title: string
  text: string
  at: string
  href: (orgId: string) => string
  unread?: boolean
  // «Прочитано в кабинете» и доставка в MAX — разные сведения (§4.7)
  max: 'delivered' | 'failed' | 'off'
}

const NOTICES: Notice[] = [
  {
    id: 'n1',
    icon: WalletIcon,
    title: 'Гость сообщил о переводе',
    text: 'RB-1048 · Дом в Репино · 14 000 ₽',
    at: '09:12',
    href: (o) => to.request('r-201', o),
    unread: true,
    max: 'delivered',
  },
  {
    id: 'n2',
    icon: MessageSquareWarningIcon,
    title: 'Конфликт дат',
    text: 'Студия на Лиговском · 12–14 окт',
    at: '08:47',
    href: (o) => to.booking('b-1045', 'overview', o),
    unread: true,
    max: 'failed',
  },
  {
    id: 'n3',
    icon: ClipboardCheckIcon,
    title: 'Отчёт ждёт проверки',
    text: 'Уборка — Апартаменты на Мойке',
    at: '08:10',
    href: (o) => to.task('t-305', o),
    max: 'delivered',
  },
  {
    id: 'n4',
    icon: CircleAlertIcon,
    title: 'Сбой обмена с Суточно',
    text: 'Последний успех 07:58 МСК',
    at: '08:05',
    href: (o) => to.settings('channels', o),
    max: 'off',
  },
]

const MAX_LABEL: Record<Notice['max'], string> = { delivered: 'MAX: доставлено', failed: 'MAX: не доставлено', off: 'MAX: не отправлялось' }

export const NotificationsPopover = () => {
  const { orgId = DEMO_ORG_ID } = useParams()
  const unread = NOTICES.filter((notice) => notice.unread).length

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Уведомления, непрочитанных: ${unread}`}
        className="relative flex size-11 items-center justify-center rounded-full bg-card outline-none transition-colors hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-foreground data-popup-open:text-background"
      >
        <BellIcon className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="mono-label absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-attention text-black">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-2rem))] gap-2 p-2">
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="section-heading text-subheading-lg">Уведомления</span>
          <Link to={to.notifications(orgId)} className="mono-label text-slate underline-offset-4 hover:underline">
            Все
          </Link>
        </div>
        <ul className="flex flex-col">
          {NOTICES.map((notice) => (
            <li key={notice.id}>
              <Link
                to={notice.href(orgId)}
                className="flex gap-3 rounded-3xl p-3 outline-none transition-colors hover:bg-mist focus-visible:bg-mist"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    notice.unread ? 'bg-foreground text-background' : 'bg-mist',
                  )}
                >
                  <notice.icon className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-body-sm font-medium">{notice.title}</span>
                    <span className="mono-label shrink-0 text-smoke">{notice.at}</span>
                  </span>
                  <span className="truncate text-body-sm text-slate">{notice.text}</span>
                  <span className={cn('mono-label', notice.max === 'failed' ? 'text-destructive' : 'text-smoke')}>
                    {MAX_LABEL[notice.max]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
