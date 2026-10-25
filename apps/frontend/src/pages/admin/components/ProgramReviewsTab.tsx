import { ArrowRightIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { type ProgramReviewFilter, useProgramReviews } from '@sportbot/api/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

const FILTERS: { value: ProgramReviewFilter; label: string }[] = [
  { value: 'queue', label: 'На проверке' },
  { value: 'published', label: 'В каталоге' },
]

const EMPTY: Record<ProgramReviewFilter, { title: string; description: string }> = {
  queue: { title: 'Проверять нечего', description: 'Все программы разобраны.' },
  published: { title: 'Каталог пуст', description: 'Пользователи ещё ничего не опубликовали.' },
}

// Программы пользователей: очередь на проверку или уже опубликованные — их можно снять или удалить
export const ProgramReviewsTab = () => {
  const [params, setParams] = useSearchParams()
  const filter = FILTERS.find(f => f.value === params.get('status'))?.value ?? 'queue'
  const reviews = useProgramReviews(filter)
  const published = filter === 'published'

  const setFilter = (next: ProgramReviewFilter) =>
    setParams(
      prev => {
        prev.set('status', next)
        return prev
      },
      { replace: true },
    )

  return (
    <div className='flex flex-col gap-5'>
      <Rise className='px-gutter'>
        <Segmented
          options={FILTERS}
          value={filter}
          onValueChange={setFilter}
          size='default'
          stretch
        />
      </Rise>
      <QueryScreen
        key={filter}
        query={reviews}
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={EMPTY[filter]}
      >
        {data =>
          data.pages
            .flatMap(page => page.items ?? [])
            .map(r => {
              const date = published ? r.publishedAt : r.reviewRequestedAt
              return (
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
                      {date && ` · ${formatDate(date, 'd MMM')}`}
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
                    to={`${buildPath(ROUTES.ADMIN_PROGRAM_REVIEW, { programId: r.id })}?status=${filter}`}
                    size='sm'
                    className='h-11'
                  >
                    {published ? 'Открыть' : 'Проверить'}
                    <ArrowRightIcon strokeWidth={3} />
                  </ButtonLink>
                </Rise>
              )
            })
        }
      </QueryScreen>
      <div className='px-gutter'>
        <LoadMore query={reviews} />
      </div>
    </div>
  )
}
