import { Link, useParams } from 'react-router'
import { DEMO_ORG_ID, ROUTES, to } from '@/shared/config/paths'
import { DEMO_TZ_FULL } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

// Футер кабинета: служебная mono-строка — часовой пояс организации, версия, помощь.
// Часовой пояс здесь не украшение: все даты кабинета показаны в нём (§9)
export const AppFooter = ({ className }: { className?: string }) => {
  const { orgId = DEMO_ORG_ID } = useParams()

  return (
    <footer
      className={cn(
        'mono-label flex flex-col gap-3 px-4 pt-10 pb-28 text-smoke md:flex-row md:items-center md:justify-between md:px-8 md:pb-8',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-foreground">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Rentybot
        </span>
        <span>Время: {DEMO_TZ_FULL}</span>
        <span>Макет · итерация 1</span>
      </div>
      <nav aria-label="Служебные ссылки" className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link to={to.help(orgId)} className="hover:text-foreground">
          Помощь
        </Link>
        <Link to={to.settings('notifications', orgId)} className="hover:text-foreground">
          Уведомления и MAX
        </Link>
        <Link to={ROUTES.PAGES} className="hover:text-foreground">
          Все экраны
        </Link>
      </nav>
    </footer>
  )
}
