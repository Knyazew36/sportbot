import { PencilIcon } from 'lucide-react'

import { useState } from 'react'

import { isPublishable, useMakeNextComplex, useProgram } from '@sportbot/api/entities/program'
import { PUBLICATION_STATUS } from '@/features/publish-program/publication-status'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue'

import { AddComplexTicket } from './AddComplexTicket'

import { PublishSheet } from '@/features/publish-program/PublishSheet'
import { ShowOthers } from '@/features/publish-program/ShowOthers'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'

// Активная программа — плакат: название, очередь комплексов билетами (последний билет — «добавить»), сводка и правка.
// Билет открывает состав комплекса в шторке. Свою программу публикуют прямо отсюда, без захода в редактор
export const ActiveProgram = ({ programId }: { programId: number }) => {
  const program = useProgram(programId)
  const [publishing, setPublishing] = useState(false)
  const makeNext = useMakeNextComplex()

  return (
    <QueryScreen
      query={program}
      rows={3}
    >
      {p => {
        const exercises = p.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
        const sets = p.complexes.reduce((sum, c) => sum + c.exercises.reduce((s, e) => s + e.sets, 0), 0)
        const publishable = isPublishable(p)
        return (
          <>
            <Rise className='px-gutter'>
              <Eyebrow
                as='p'
                tone='positive'
              >
                Активная программа
              </Eyebrow>
              <Poster
                as='h1'
                size='3xl'
                tone='positive'
                className='mt-3 hyphens-auto'
              >
                {p.name}
              </Poster>
              {publishable && p.publication !== 'DRAFT' && (
                <div className='mt-3'>
                  <StatusFromMeta meta={PUBLICATION_STATUS[p.publication]} />
                </div>
              )}
              {p.fromFriend && (
                <Text
                  tone='soft'
                  className='mt-2'
                >
                  от {p.fromFriend}
                </Text>
              )}
            </Rise>
            <ComplexQueue
              complexes={p.complexes}
              activeId={p.complexes.find(c => c.isNext)?.id}
              aside={p.complexes.length > 0 ? 'следующая подсвечена' : undefined}
              onPick={id => makeNext.mutate(id)}
              pickLabel='Сделать следующей'
              trailing={
                <AddComplexTicket
                  programId={p.id}
                  count={p.complexes.length}
                />
              }
            />
            <Rise className='px-gutter flex flex-col gap-4'>
              <StatGrid
                items={[
                  { label: 'тренировок', value: p.complexes.length },
                  { label: pluralize(exercises, EXERCISE_FORMS, { withCount: false }), value: exercises },
                  { label: pluralize(sets, SET_FORMS, { withCount: false }), value: sets },
                ]}
              />
              <ButtonLink
                to={buildPath(ROUTES.PROGRAM, { programId: p.id })}
                variant='outline'
                className='w-full'
              >
                <PencilIcon />
                Редактировать
              </ButtonLink>
              <ShowOthers
                program={p}
                onPublish={() => setPublishing(true)}
                className='mt-2'
              />
            </Rise>
            {publishable && (
              <PublishSheet
                program={p}
                open={publishing}
                onOpenChange={setPublishing}
              />
            )}
          </>
        )
      }}
    </QueryScreen>
  )
}
