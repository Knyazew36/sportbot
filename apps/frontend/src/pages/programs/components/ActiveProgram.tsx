import { PencilIcon } from 'lucide-react'

import { complexLetter, useProgram } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

// Активная программа — плакат: название, очередь комплексов билетами, сводка и правка
export const ActiveProgram = ({ programId }: { programId: number }) => {
  const program = useProgram(programId)

  return (
    <QueryScreen
      query={program}
      rows={3}
    >
      {p => {
        const exercises = p.complexes.reduce((sum, c) => sum + c.exercises.length, 0)
        const sets = p.complexes.reduce((sum, c) => sum + c.exercises.reduce((s, e) => s + e.sets, 0), 0)
        return (
          <>
            <Rise className='px-5'>
              <Eyebrow as='p'>Активная программа</Eyebrow>
              <Poster
                as='h1'
                size='3xl'
                tone='primary'
                className='mt-3 hyphens-auto'
              >
                {p.name}
              </Poster>
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
              <ScreenSection
                title='Очередь комплексов'
                aside='следующий подсвечен'
                bleed
              >
                <ol className='no-scrollbar flex gap-2 overflow-x-auto px-5'>
                  {p.complexes.map((c, i) => (
                    <li key={c.id}>
                      <Ticket
                        mark={complexLetter(i)}
                        title={c.name}
                        active={c.isNext}
                      >
                        <Eyebrow>{c.exercises.length} упр.</Eyebrow>
                      </Ticket>
                    </li>
                  ))}
                </ol>
              </ScreenSection>
            )}
            <Rise className='flex flex-col gap-4 px-5'>
              <StatGrid
                items={[
                  { label: 'комплексов', value: p.complexes.length },
                  { label: 'упражнений', value: exercises },
                  { label: 'подходов', value: sets },
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
            </Rise>
          </>
        )
      }}
    </QueryScreen>
  )
}
