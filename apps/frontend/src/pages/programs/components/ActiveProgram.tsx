import { GlobeIcon, PencilIcon } from 'lucide-react'

import { useState } from 'react'

import { isPublishable, publishLabel, PUBLICATION_STATUS, useMakeNextComplex, useProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue'

import { PublishSheet } from './PublishSheet'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'

// Активная программа — плакат: название, очередь комплексов билетами, сводка и правка.
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
        const sent = p.publication === 'PENDING' || p.publication === 'PUBLISHED'
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
            {p.complexes.length > 0 && (
              <ComplexQueue
                complexes={p.complexes}
                activeId={p.complexes.find(c => c.isNext)?.id}
                aside='следующий подсвечен'
                onPick={id => makeNext.mutate(id)}
                pickLabel='Сделать следующим'
              />
            )}
            <Rise className='px-gutter flex flex-col gap-4'>
              <StatGrid
                items={[
                  { label: 'комплексов', value: p.complexes.length },
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
              {publishable && (
                <Button
                  // Уже отправленную только правят — это не выход наружу, поэтому без жёлтого
                  variant={sent ? 'outline' : 'share'}
                  className='w-full'
                  onClick={() => setPublishing(true)}
                >
                  <GlobeIcon />
                  {publishLabel(p.publication)}
                </Button>
              )}
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
