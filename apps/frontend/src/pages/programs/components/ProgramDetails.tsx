import { useState } from 'react'

import { addedText, complexLetter, planText, type Program } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { ComplexQueue } from '@/widgets/complex-queue/ComplexQueue'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'
import { pluralize } from '@front-cmdt/utils/pluralize'

// Чужая программа целиком, прежде чем взять себе: из каталога и по ссылке «Поделиться» (frontend-tz, 10.2)
export const ProgramDetails = ({ program }: { program: Program }) => {
  // Упражнение, открытое в шторке: состав видно, не уходя со страницы программы
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)
  const exercises = program.complexes.reduce((sum, c) => sum + c.exercises.length, 0)

  return (
    <>
      <Rise className='px-gutter'>
        <Poster
          as='h1'
          size='3xl'
          tone='primary'
          className='hyphens-auto'
        >
          {program.name}
        </Poster>
        {program.author && (
          <div className='mt-3 flex items-center gap-2'>
            <PersonAvatar
              name={program.author.name}
              src={toAssetUrl(program.author.avatarUrl)}
              size='sm'
            />
            <Text
              size='sm'
              tone='muted'
            >
              {program.mine ? 'Твоя программа' : program.author.name}
            </Text>
          </div>
        )}
        {program.description && (
          <Text
            tone='soft'
            className='mt-3'
          >
            {program.description}
          </Text>
        )}
        <Eyebrow
          as='p'
          className='mt-3'
        >
          {addedText(program.addedCount)}
        </Eyebrow>
      </Rise>

      <Rise className='px-gutter'>
        <StatGrid
          items={[
            { label: 'тренировок', value: program.complexes.length },
            { label: pluralize(exercises, EXERCISE_FORMS, { withCount: false }), value: exercises },
          ]}
        />
      </Rise>

      <ComplexQueue
        complexes={program.complexes}
        activeId={program.complexes[0]?.id}
        aside='по кругу, с первого'
      />

      {program.complexes.map((c, i) => (
        <ScreenSection
          key={c.id}
          title={`${complexLetter(i)} · ${c.name}`}
          aside={pluralize(
            c.exercises.reduce((sum, e) => sum + e.sets, 0),
            SET_FORMS,
          )}
        >
          <List>
            <ExerciseBlocks items={c.exercises}>
              {(e, j, label) => (
              // Вся строка открывает карточку упражнения: кнопка растянута на строку
              <ListRow
                key={e.id}
                // В суперсете строка внутри рамки: на всю ширину экрана подсветка её перекрыла бы
                className={cn(
                  'hover:bg-accent/60 relative transition-colors',
                  !label && '-mx-gutter px-gutter',
                )}
                lead={label ?? String(j + 1).padStart(2, '0')}
                title={
                  <button
                    type='button'
                    className='text-left after:absolute after:inset-0'
                    onClick={() => setOpened({ id: e.exerciseId, name: e.name })}
                  >
                    {e.name}
                  </button>
                }
                meta={e.muscles}
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
              )}
            </ExerciseBlocks>
          </List>
        </ScreenSection>
      ))}

      <Rise className='px-gutter'>
        <Text
          size='xs'
          tone='muted'
        >
          После «Взять» копия становится твоей программой — её можно править.
        </Text>
      </Rise>

      <ExerciseSheet
        exercise={opened}
        onOpenChange={open => !open && setOpened(null)}
        action={
          opened && (
            <ButtonLink
              to={buildPath(ROUTES.EXERCISE, { exerciseId: opened.id })}
              variant='outline'
              size='lg'
              className='w-full'
            >
              Подробнее в справочнике
            </ButtonLink>
          )
        }
      />
    </>
  )
}
