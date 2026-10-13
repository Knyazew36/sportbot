import { Link } from 'react-router'

import { ORG_ROLE_LABEL, useCurrentOrganization, useMe } from '@/entities/session'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { displayName } from '@/shared/lib/format'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Стартовая страница кабинета — заготовка: проект заменяет её своей сводкой
const DashboardPage = () => {
  const { data: me } = useMe()
  const { orgId, organization, role } = useCurrentOrganization()

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow={role ? ORG_ROLE_LABEL[role] : undefined}
        title={organization?.name ?? 'Организация'}
        meta={`Здравствуйте, ${displayName(me)}`}
      />
      <SectionCard title='С чего начать'>
        <p className='text-body-sm text-slate'>
          Это заготовка шаблона. Добавьте сюда сводку проекта: страница лежит в src/pages/dashboard.
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            asChild
            variant='secondary'
          >
            <Link to={buildPath(ROUTES.MEMBERS, { orgId })}>Участники</Link>
          </Button>
          <Button
            asChild
            variant='secondary'
          >
            <Link to={buildPath(ROUTES.PROFILE, { orgId })}>Профиль</Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

export default DashboardPage
