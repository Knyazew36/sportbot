import { TriangleAlertIcon } from 'lucide-react'

import { useState } from 'react'

import type { DayToday } from '@/entities/day'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

import { planText } from '@/entities/program'

type Complex = NonNullable<DayToday['complex']>

// Состав комплекса с планом подходов. Упражнение на зону с ограничением помечено ⚠️ (business-tz, 11)
export const ComplexExercises = ({ complex }: { complex: Complex }) => {
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)

  return (
    <ScreenSection
      title='Состав'
      aside={`${complex.exercises.length} упр.`}
    >
      {complex.exercises.length === 0 ? (
        <Text tone='soft'>В комплексе пока нет упражнений — добавь их в программе.</Text>
      ) : (
        <List>
          <ExerciseBlocks items={complex.exercises}>
            {(e, i, label) => (
            // Вся строка открывает карточку упражнения: кнопка растянута на строку
            <ListRow
              key={e.id}
              // В суперсете строка внутри рамки: на всю ширину экрана подсветка её перекрыла бы
              className={cn('hover:bg-accent/60 relative transition-colors', !label && '-mx-gutter px-gutter')}
              lead={label ?? String(i + 1).padStart(2, '0')}
              title={
                <button
                  type='button'
                  className='text-left after:absolute after:inset-0'
                  onClick={() => setOpened({ id: e.exerciseId, name: e.name })}
                >
                  {e.name}
                </button>
              }
              meta={e.muscles || undefined}
              trail={
                <Poster
                  as='span'
                  className='whitespace-nowrap'
                >
                  {planText(e.sets, e.repsMin, e.repsMax)}
                </Poster>
              }
            >
              {e.limitedZones.length > 0 && (
                <Text
                  as='p'
                  size='xs'
                  tone='primary'
                  className='mt-2 flex items-center gap-1.5'
                >
                  <TriangleAlertIcon
                    className='size-3.5 shrink-0'
                    aria-hidden
                  />
                  нагружает {e.limitedZones.join(', ')} — заменить можно на тренировке
                </Text>
              )}
            </ListRow>
            )}
          </ExerciseBlocks>
          {complex.cardioName && (
            <ListRow
              lead='+'
              title={complex.cardioName}
              meta='кардио'
              trail={
                complex.cardioMinutes ? (
                  <Poster
                    as='span'
                    className='whitespace-nowrap'
                  >
                    {complex.cardioMinutes} мин
                  </Poster>
                ) : undefined
              }
            />
          )}
        </List>
      )}

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
    </ScreenSection>
  )
}
