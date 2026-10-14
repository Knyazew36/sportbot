import { CheckIcon, PencilIcon, XIcon } from 'lucide-react'

import { useCloseComplaint, useComplaints } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

// Жалобы на описания: текст, запись, «править запись», «исправлено» или «отклонить» (frontend-tz, 14.4)
export const ComplaintsTab = () => {
  const complaints = useComplaints()
  const close = useCloseComplaint()

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
            .map(c => (
              <Rise
                key={c.id}
                className='border-foreground/80 mx-5 flex flex-col gap-3 border-[1.5px] p-4'
              >
                <div className='flex flex-wrap items-center gap-1.5'>
                  <Badge variant='secondary'>{c.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
                  <Eyebrow>
                    {c.author ?? 'удалённый пользователь'} · {formatDate(c.createdAt, 'd MMM')}
                  </Eyebrow>
                </div>
                <Poster>{c.entryName}</Poster>
                <Text className='border-primary/60 border-l-2 pl-3'>{c.text}</Text>
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
                    disabled={close.isPending}
                    onClick={() => close.mutate({ id: c.id, status: 'RESOLVED' })}
                  >
                    <CheckIcon strokeWidth={3} />
                    Исправлено
                  </Button>
                  <Button
                    variant='outline'
                    size='icon-lg'
                    className='h-11'
                    aria-label='Отклонить жалобу'
                    disabled={close.isPending}
                    onClick={() => close.mutate({ id: c.id, status: 'REJECTED' })}
                  >
                    <XIcon />
                  </Button>
                </div>
              </Rise>
            ))
        }
      </QueryScreen>
      <div className='px-5'>
        <LoadMore query={complaints} />
      </div>
    </div>
  )
}
