import { HammerIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { PageHeader } from '@/shared/ui/rb/PageHeader'

// Заглушка разделов следующих этапов (§10 п.6–7): маршрут и навигация уже есть, макета ещё нет
const SoonPage = () => {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={pathname} title="Раздел в работе" />
      <div className="flex flex-col items-start gap-6 rounded-card bg-card p-6 md:flex-row md:items-center md:p-10">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-mist">
          <HammerIcon className="size-7" aria-hidden />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <span className="mono-label text-smoke">Следующие итерации</span>
          <p className="max-w-xl text-body-sm text-slate">
            Деньги, специалисты, настройки, уведомления и помощь макетируются на этапах 6–7. Навигация и права пункта меню уже
            работают.
          </p>
        </div>
        <Link to={ROUTES.PAGES} className="mono-label rounded-full bg-mist px-3 py-2 hover:bg-ash/50">
          Все экраны →
        </Link>
      </div>
    </div>
  )
}

export default SoonPage
