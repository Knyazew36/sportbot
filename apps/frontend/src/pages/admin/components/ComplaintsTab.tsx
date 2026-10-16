import { CheckIcon, PencilIcon, XIcon } from 'lucide-react'

import { useState } from 'react'

import { useApplyComplaint, useCloseComplaint, useComplaints } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { ProposalDiff } from './ProposalDiff'
import { RejectComplaintSheet } from './RejectComplaintSheet'

type Rejecting = { id: number; entryName: string; isProposal: boolean }

// Жалобы и правки описаний: текст или «было → стало», запись, «применить» / «исправлено» или «отклонить» с причиной
// (frontend-tz, 14.4)
export const ComplaintsTab = () => {
  const complaints = useComplaints()
  const close = useCloseComplaint()
  const apply = useApplyComplaint()
  const [rejecting, setRejecting] = useState<Rejecting | null>(null)
  const busy = close.isPending || apply.isPending

  return (
    <div className='flex flex-col gap-5'>
      <QueryScreen
        query={complaints}
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{ title: 'Жалоб нет', description: 'Все разобраны.' }}
      >
        {data =>
          data.pages
            .flatMap(page => page.items ?? [])
            .map(c => {
              const isProposal = c.changes.length > 0
              return (
                <Rise
                  key={c.id}
                  className='border-foreground/80 mx-gutter flex flex-col gap-3 border-[1.5px] p-4'
                >
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <Badge variant='secondary'>{c.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
                    {isProposal && <Badge>правка</Badge>}
                    <Eyebrow>
                      {c.author ?? 'удалённый пользователь'} · {formatDate(c.createdAt, 'd MMM')}
                    </Eyebrow>
                  </div>
                  <Poster>{c.entryName}</Poster>
                  {isProposal && (
                    <ProposalDiff
                      changes={c.changes}
                      alt={c.entryName}
                    />
                  )}
                  {c.text && <Text className='border-primary/60 border-l-2 pl-3'>{c.text}</Text>}
                  <div className='grid grid-cols-[1fr_auto_auto] gap-2'>
                    {c.entryId != null ? (
                      <ButtonLink
                        to={buildPath(ROUTES.ADMIN_CATALOG_ITEM, { kind: c.kind, itemId: c.entryId })}
                        variant='outline'
                        size='sm'
                        className='h-11'
                      >
                        <PencilIcon />
                        Править
                      </ButtonLink>
                    ) : (
                      <span />
                    )}
                    <Button
                      size='sm'
                      className='h-11'
                      disabled={busy}
                      onClick={() => (isProposal ? apply.mutate(c.id) : close.mutate({ id: c.id, status: 'RESOLVED' }))}
                    >
                      <CheckIcon strokeWidth={3} />
                      {isProposal ? 'Применить' : 'Исправлено'}
                    </Button>
                    <Button
                      variant='outline'
                      size='icon-lg'
                      className='h-11'
                      aria-label={isProposal ? 'Отклонить правку' : 'Отклонить жалобу'}
                      disabled={busy}
                      onClick={() => setRejecting({ id: c.id, entryName: c.entryName, isProposal })}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </Rise>
              )
            })
        }
      </QueryScreen>
      <div className='px-gutter'>
        <LoadMore query={complaints} />
      </div>
      <RejectComplaintSheet
        complaint={rejecting}
        onClose={() => setRejecting(null)}
      />
    </div>
  )
}
