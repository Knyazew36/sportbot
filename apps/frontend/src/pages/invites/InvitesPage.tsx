import { PlusIcon } from 'lucide-react'

import { type Invite, useCreateInvite, useDeleteInvite, useInvites } from '@/entities/invite/api'
import { useCurrentOrganization } from '@/entities/session'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate, pluralize } from '@/shared/lib/format'
import { usePageParam } from '@/shared/lib/hooks/use-page-param'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { Pagination } from '@/shared/ui/kit/Pagination'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'

const inviteUrl = (invite: Invite) => `${window.location.origin}${buildPath(ROUTES.INVITE, { token: invite.token })}`

const InviteRow = ({ invite }: { invite: Invite }) => {
  const { orgId } = useCurrentOrganization()
  const deleteInvite = useDeleteInvite(orgId)
  const url = inviteUrl(invite)

  return (
    <li className='flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center'>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <span className='text-body-sm truncate font-mono'>{url}</span>
        <span className='mono-label text-smoke'>
          Создано {formatDate(invite.createdAt)} ·{' '}
          {invite.expiresAt ? `до ${formatDate(invite.expiresAt)}` : 'бессрочно'} ·{' '}
          {pluralize(invite.usedCount, ['заявка', 'заявки', 'заявок'])}
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <CopyButton
          content={url}
          variant='secondary'
          size='sm'
          aria-label='Скопировать ссылку'
        />
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              size='sm'
            />
          }
          title='Удалить приглашение?'
          description='Ссылка перестанет работать. Уже поданные заявки останутся.'
          confirmLabel='Удалить'
          onConfirm={() =>
            deleteInvite.mutateAsync(invite.id, {
              onSuccess: notifySuccess('Приглашение удалено'),
              onError: notifyError,
            })
          }
        >
          Удалить
        </ConfirmAction>
      </div>
    </li>
  )
}

// Ссылки-приглашения: по ссылке человек подаёт заявку, её одобряют на странице «Заявки»
const InvitesPage = () => {
  const { orgId } = useCurrentOrganization()
  const [page, setPage] = usePageParam()
  const invites = useInvites(orgId, { page })
  const createInvite = useCreateInvite(orgId)

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow='Организация'
        title='Приглашения'
        actions={
          <Button
            disabled={createInvite.isPending}
            onClick={() =>
              createInvite.mutate(undefined, { onSuccess: notifySuccess('Ссылка создана'), onError: notifyError })
            }
          >
            <PlusIcon /> Новая ссылка
          </Button>
        }
      />
      <QueryState
        query={invites}
        isEmpty={data => data.items.length === 0}
        empty={{ title: 'Ссылок нет', description: 'Создайте ссылку и отправьте её тому, кого хотите пригласить.' }}
      >
        {data => (
          <SectionCard>
            <ul className='flex flex-col'>
              {data.items.map(invite => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                />
              ))}
            </ul>
            <Pagination
              meta={data.meta}
              onPageChange={setPage}
              className='mt-4'
            />
          </SectionCard>
        )}
      </QueryState>
    </div>
  )
}

export default InvitesPage
