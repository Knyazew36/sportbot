import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRightIcon, LogOutIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'

import { JOIN_REQUEST_STATUS_LABEL, useMyJoinRequests } from '@/entities/join-request/api'
import { useCreateOrganization } from '@/entities/organization/api'
import { logout, ORG_ROLE_LABEL, useMe } from '@/entities/session'
import { APP_NAME } from '@/shared/config/app'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { notifyError } from '@/shared/lib/notify'
import { SectionCard } from '@/shared/ui/kit/Section'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const schema = z.object({ name: z.string().trim().min(1, 'Введите название').max(100) })

const CreateOrganizationForm = () => {
  const navigate = useNavigate()
  const create = useCreateOrganization()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(values =>
    create.mutate(values, {
      onSuccess: organization => navigate(buildPath(ROUTES.DASHBOARD, { orgId: organization.id })),
      onError: notifyError,
    }),
  )

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className='flex flex-col gap-4 sm:flex-row sm:items-start'
    >
      <div className='flex-1'>
        <TextField
          label='Название'
          placeholder='Моя команда'
          error={errors.name}
          {...register('name')}
        />
      </div>
      <Button
        type='submit'
        className='sm:mt-7'
        disabled={create.isPending}
      >
        Создать
      </Button>
    </form>
  )
}

// Выбор рабочей области: сюда ведёт корень сайта, если организация прошлого визита неизвестна
const WorkspacesPage = () => {
  const { data: me } = useMe()
  const { data: requests = [] } = useMyJoinRequests()
  const organizations = me?.organizations ?? []
  const pending = requests.filter(request => request.status === 'PENDING')

  return (
    <main className='mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-4 py-10'>
      <header className='flex items-center justify-between gap-4'>
        <span className='section-heading text-subheading-lg font-medium'>{APP_NAME}</span>
        <Button
          variant='ghost'
          size='sm'
          onClick={logout}
        >
          <LogOutIcon /> Выйти
        </Button>
      </header>
      <h1 className='section-heading text-heading-sm'>Рабочие области</h1>

      {organizations.length > 0 && (
        <SectionCard
          title='Ваши организации'
          count={organizations.length}
        >
          <ul className='flex flex-col'>
            {organizations.map(organization => (
              <li key={organization.id}>
                <Link
                  to={buildPath(ROUTES.DASHBOARD, { orgId: organization.id })}
                  className='hover:bg-mist flex items-center gap-3 rounded-3xl p-3 transition-colors'
                >
                  <span className='bg-foreground text-background flex size-10 items-center justify-center rounded-2xl font-medium'>
                    {organization.name[0]?.toUpperCase()}
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate font-medium'>{organization.name}</span>
                    <span className='mono-label text-smoke'>{ORG_ROLE_LABEL[organization.role]}</span>
                  </span>
                  <ChevronRightIcon
                    className='text-smoke size-4'
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {pending.length > 0 && (
        <SectionCard title='Ваши заявки'>
          <ul className='flex flex-col gap-2'>
            {pending.map(request => (
              <li
                key={request.id}
                className='flex items-center justify-between gap-3 p-3'
              >
                <span className='truncate'>{request.organizationName}</span>
                <span className='mono-label text-smoke'>{JOIN_REQUEST_STATUS_LABEL[request.status]}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title='Новая организация'>
        <CreateOrganizationForm />
      </SectionCard>
    </main>
  )
}

export default WorkspacesPage
