import { useSearchParams } from 'react-router'

import {
  JOIN_REQUEST_STATUS_LABEL,
  type JoinRequest,
  type JoinRequestStatus,
  useDecideJoinRequest,
  useJoinRequests,
} from '@/entities/join-request/api'
import { useCurrentOrganization } from '@/entities/session'
import { toAssetUrl } from '@/shared/api'
import { displayName, formatDateTime } from '@/shared/lib/format'
import { usePageParam } from '@/shared/lib/hooks/use-page-param'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { FilterBar, type FilterDef } from '@/shared/ui/kit/FilterBar'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { Pagination } from '@/shared/ui/kit/Pagination'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const STATUSES = Object.keys(JOIN_REQUEST_STATUS_LABEL) as JoinRequestStatus[]

const FILTERS: FilterDef[] = [
  {
    key: 'status',
    label: 'Статус',
    options: STATUSES.map(value => ({ value, label: JOIN_REQUEST_STATUS_LABEL[value] })),
  },
]

const parseStatus = (value: string | null): JoinRequestStatus | undefined => STATUSES.find(status => status === value)

const RequestRow = ({ request }: { request: JoinRequest }) => {
  const decide = useDecideJoinRequest()
  const name = displayName(request)

  const act = (decision: 'approve' | 'reject') =>
    decide.mutate(
      { id: request.id, decision },
      {
        onSuccess: notifySuccess(decision === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена'),
        onError: notifyError,
      },
    )

  return (
    <li className='flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center'>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <PersonAvatar
          name={name}
          src={toAssetUrl(request.avatarUrl)}
        />
        <div className='flex min-w-0 flex-col'>
          <span className='text-body-sm truncate font-medium'>{name}</span>
          <span className='mono-label text-smoke truncate'>
            {[request.email, request.phone].filter(Boolean).join(' · ') || '—'} · {formatDateTime(request.createdAt)}
          </span>
        </div>
      </div>
      {request.status === 'PENDING' ? (
        <div className='flex gap-2'>
          <Button
            size='sm'
            disabled={decide.isPending}
            onClick={() => act('approve')}
          >
            Одобрить
          </Button>
          <Button
            size='sm'
            variant='secondary'
            disabled={decide.isPending}
            onClick={() => act('reject')}
          >
            Отклонить
          </Button>
        </div>
      ) : (
        <span className='mono-label bg-mist rounded-full px-3 py-1.5'>{JOIN_REQUEST_STATUS_LABEL[request.status]}</span>
      )}
    </li>
  )
}

const JoinRequestsPage = () => {
  const { orgId } = useCurrentOrganization()
  const [params] = useSearchParams()
  const [page, setPage] = usePageParam()
  const requests = useJoinRequests(orgId, { page, status: parseStatus(params.get('status')) })

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow='Организация'
        title='Заявки на вступление'
      />
      <FilterBar filters={FILTERS} />
      <QueryState
        query={requests}
        isEmpty={data => data.items.length === 0}
        empty={{ title: 'Заявок нет', description: 'Заявки появляются, когда кто-то переходит по ссылке-приглашению.' }}
      >
        {data => (
          <SectionCard>
            <ul className='flex flex-col'>
              {data.items.map(request => (
                <RequestRow
                  key={request.id}
                  request={request}
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

export default JoinRequestsPage
