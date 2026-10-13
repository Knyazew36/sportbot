import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import {
  type Organization,
  useDeleteOrganization,
  useOrganization,
  useUpdateOrganization,
} from '@/entities/organization/api'
import { useCurrentOrganization } from '@/entities/session'
import { forgetLastOrganizationId } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const schema = z.object({ name: z.string().trim().min(1, 'Введите название').max(100) })

type FormValues = z.infer<typeof schema>

const OrganizationForm = ({ organization }: { organization: Organization }) => {
  const update = useUpdateOrganization(organization.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: organization.name } })

  const onSubmit = handleSubmit(values =>
    update.mutate(values, {
      onSuccess: saved => {
        reset({ name: saved.name })
        notifySuccess('Сохранено')()
      },
      onError: notifyError,
    }),
  )

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className='flex max-w-md flex-col gap-4'
    >
      <TextField
        label='Название'
        error={errors.name}
        {...register('name')}
      />
      <Button
        type='submit'
        className='self-start'
        disabled={!isDirty || update.isPending}
      >
        Сохранить
      </Button>
    </form>
  )
}

const SettingsPage = () => {
  const navigate = useNavigate()
  const { orgId } = useCurrentOrganization()
  const organization = useOrganization(orgId)
  const remove = useDeleteOrganization(orgId)

  const onDelete = () =>
    remove.mutateAsync(undefined, {
      onSuccess: () => {
        forgetLastOrganizationId()
        notifySuccess('Организация удалена')()
        navigate(ROUTES.WORKSPACES)
      },
      onError: notifyError,
    })

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow='Организация'
        title='Настройки'
      />
      <QueryState
        query={organization}
        skeleton='record'
      >
        {data => (
          <>
            <SectionCard title='Основное'>
              <OrganizationForm organization={data} />
            </SectionCard>
            <SectionCard title='Удаление'>
              <p className='text-body-sm text-slate mb-4'>
                Участники потеряют доступ. Восстановить организацию может только администратор платформы.
              </p>
              <ConfirmAction
                trigger={
                  <Button
                    variant='destructive'
                    className='self-start'
                  />
                }
                title={`Удалить «${data.name}»?`}
                confirmLabel='Удалить'
                onConfirm={onDelete}
              >
                Удалить организацию
              </ConfirmAction>
            </SectionCard>
          </>
        )}
      </QueryState>
    </div>
  )
}

export default SettingsPage
