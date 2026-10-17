import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { type ProgramReview, useApproveProgramReview, useProgramReview } from '@/entities/admin'
import { complexLetter, planText, PUBLICATION_STATUS, useAllTagGroups } from '@/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { PendingTagRow } from './components/PendingTagRow'
import { type ProgramRejectMode, RejectProgramSheet } from './components/RejectProgramSheet'

const BACK = `${ROUTES.ADMIN}?tab=programs`

// Было → стало: у опубликованной программы в каталоге висит одобренный текст, автор прислал новый
const TextChange = ({ label, before, after }: { label: string; before: string | null; after: string | null }) =>
  before === after ? null : (
    <div className='flex flex-col gap-1'>
      <Eyebrow as='p'>{label}</Eyebrow>
      <Text
        tone='muted'
        className='line-through'
      >
        {before || 'пусто'}
      </Text>
      <Text className='border-primary/60 border-l-2 pl-3'>{after || 'пусто'}</Text>
    </div>
  )

const ReviewBody = ({ review: r }: { review: ProgramReview }) => {
  const groups = useAllTagGroups()
  const approved = r.tags.filter(t => t.isApproved)
  const pending = r.tags.filter(t => !t.isApproved)
  const editing = r.publication === 'PUBLISHED' && r.textPending

  return (
    <>
      <Rise className='px-gutter flex flex-col gap-3'>
        <StatusFromMeta meta={PUBLICATION_STATUS[r.publication]} />
        <Poster
          as='h1'
          size='2xl'
          className='hyphens-auto'
        >
          {r.name}
        </Poster>
        <Eyebrow as='p'>{r.author ?? 'удалённый пользователь'}</Eyebrow>
        {editing ? (
          <>
            <TextChange
              label='Название'
              before={r.publishedName}
              after={r.name}
            />
            <TextChange
              label='Описание'
              before={r.publishedDescription}
              after={r.description}
            />
          </>
        ) : (
          r.description && <Text tone='soft'>{r.description}</Text>
        )}
        {approved.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {approved.map(t => (
              <Badge key={t.id}>{t.name}</Badge>
            ))}
          </div>
        )}
      </Rise>

      {pending.length > 0 && (
        <ScreenSection
          title='Свои теги автора'
          aside='реши до публикации'
        >
          {pending.map(t => (
            <PendingTagRow
              key={t.id}
              tag={t}
              group={groups.data?.find(g => g.id === t.groupId)}
            />
          ))}
        </ScreenSection>
      )}

      {r.complexes.map((c, i) => (
        <ScreenSection
          key={c.id}
          title={`${complexLetter(i)} · ${c.name}`}
        >
          <List>
            {c.exercises.map((e, j) => (
              <ListRow
                key={e.id}
                lead={String(j + 1).padStart(2, '0')}
                title={e.name}
                meta={e.draft ? `${e.muscles} · черновик автора` : e.muscles}
                trail={
                  <Poster
                    as='span'
                    size='sm'
                    className='whitespace-nowrap'
                  >
                    {planText(e.sets, e.repsMin, e.repsMax, e.measure)}
                  </Poster>
                }
              />
            ))}
          </List>
        </ScreenSection>
      ))}
    </>
  )
}

// Проверка программы пользователя перед каталогом: текст, теги, состав. Одобрить, отклонить с причиной или снять
const ProgramReviewPage = () => {
  const programId = Number(useParams().programId)
  const navigate = useNavigate()
  const review = useProgramReview(programId)
  const approve = useApproveProgramReview()
  const [rejecting, setRejecting] = useState<ProgramRejectMode | null>(null)
  const r = review.data
  const done = () => navigate(BACK, { replace: true })
  const hasPendingTags = !!r?.tags.some(t => !t.isApproved)

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={r?.name ?? 'Программа'}
          subtitle='на проверке'
        />
      }
      footer={
        r &&
        (r.textPending ? (
          <StickyFooter className='flex-nowrap'>
            <Button
              variant='outline'
              size='lg'
              className='flex-1'
              onClick={() => setRejecting('reject')}
            >
              Отклонить
            </Button>
            <Button
              size='lg'
              className='flex-1'
              // Свои теги автора решаются до публикации: сервер иначе откажет
              disabled={approve.isPending || hasPendingTags}
              onClick={() => approve.mutateAsync(r.id).then(done)}
            >
              Опубликовать
            </Button>
          </StickyFooter>
        ) : (
          r.publication === 'PUBLISHED' && (
            <StickyFooter>
              <Button
                variant='outline'
                size='lg'
                className='w-full'
                onClick={() => setRejecting('takeDown')}
              >
                Снять из каталога
              </Button>
            </StickyFooter>
          )
        ))
      }
    >
      <QueryScreen query={review}>{data => <ReviewBody review={data} />}</QueryScreen>
      {r && (
        <RejectProgramSheet
          program={r}
          mode={rejecting}
          onClose={() => setRejecting(null)}
          onDone={done}
        />
      )}
    </Screen>
  )
}

export default ProgramReviewPage
