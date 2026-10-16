import { ArrowRightIcon } from 'lucide-react'

import { useProgramReviews } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate, pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

// Программы пользователей на проверке: что ждёт решения — публикация, правка текста или свои теги автора
export const ProgramReviewsTab = () => {
  const reviews = useProgramReviews()

  return (
    <div className='flex flex-col gap-5'>
      <QueryScreen
        query={reviews}
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{ title: 'Проверять нечего', description: 'Все программы разобраны.' }}
      >
        {data =>
          data.pages
            .flatMap(page => page.items ?? [])
            .map(r => (
              <Rise
                key={r.id}
                className='border-foreground/80 mx-gutter flex flex-col gap-3 border-[1.5px] p-4'
              >
                <div className='flex flex-wrap items-center gap-1.5'>
                  {r.textPending && (
                    <Badge variant='secondary'>{r.publication === 'PUBLISHED' ? 'правка текста' : 'новая'}</Badge>
                  )}
                  {r.pendingTagCount > 0 && <Badge variant='secondary'>свои теги</Badge>}
                  <Eyebrow>
                    {r.author ?? 'удалённый пользователь'}
                    {r.reviewRequestedAt && ` · ${formatDate(r.reviewRequestedAt, 'd MMM')}`}
                  </Eyebrow>
                </div>
                <Poster>{r.name}</Poster>
                {r.pendingTagCount > 0 && (
                  <Text
                    size='sm'
                    tone='muted'
                  >
                    {pluralize(r.pendingTagCount, ['свой тег', 'своих тега', 'своих тегов'])} ждут решения
                  </Text>
                )}
                <ButtonLink
                  to={buildPath(ROUTES.ADMIN_PROGRAM_REVIEW, { programId: r.id })}
                  size='sm'
                  className='h-11'
                >
                  Проверить
                  <ArrowRightIcon strokeWidth={3} />
                </ButtonLink>
              </Rise>
            ))
        }
      </QueryScreen>
      <div className='px-gutter'>
        <LoadMore query={reviews} />
      </div>
    </div>
  )
}
