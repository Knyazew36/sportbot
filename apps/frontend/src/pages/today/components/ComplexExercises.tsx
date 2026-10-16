import { TriangleAlertIcon } from 'lucide-react'

import type { DayToday } from '@/entities/day'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'

import { planText } from '@/entities/program'

type Complex = NonNullable<DayToday['complex']>

// Состав комплекса с планом подходов. Упражнение на зону с ограничением помечено ⚠️ (business-tz, 11)
export const ComplexExercises = ({ complex }: { complex: Complex }) => (
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
          <ListRow
            key={e.id}
            lead={label ?? String(i + 1).padStart(2, '0')}
            title={e.name}
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
  </ScreenSection>
)
