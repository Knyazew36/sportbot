import { useAuditLog } from '@/entities/audit-log/api'
import { useCurrentOrganization } from '@/entities/session'
import { formatDateTime } from '@/shared/lib/format'
import { usePageParam } from '@/shared/lib/hooks/use-page-param'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { Pagination } from '@/shared/ui/kit/Pagination'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table'

// Журнал мутаций организации: сервер пишет его сам и хранит 90 дней
const AuditLogPage = () => {
  const { orgId } = useCurrentOrganization()
  const [page, setPage] = usePageParam()
  const log = useAuditLog(orgId, { page })

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow='Организация'
        title='Журнал действий'
      />
      <QueryState
        query={log}
        skeleton='list'
        isEmpty={data => data.items.length === 0}
      >
        {data => (
          <SectionCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Когда</TableHead>
                  <TableHead>Кто</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Объект</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className='mono-label whitespace-nowrap'>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell>{item.userDisplayName ?? 'Система'}</TableCell>
                    <TableCell className='text-body-sm font-mono'>{item.action}</TableCell>
                    <TableCell className='mono-label'>
                      {item.entity}
                      {item.entityId != null && ` #${item.entityId}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default AuditLogPage
