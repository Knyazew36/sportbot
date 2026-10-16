import { CheckIcon, MinusIcon } from 'lucide-react'

import { lastText, type SharedWorkout } from '@/entities/workout'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster } from '@/shared/ui/kit/Typography'

// Протокол: подходы по каждому упражнению
export const ResultExercises = ({ workout }: { workout: SharedWorkout }) => (
  <ScreenSection title='Протокол'>
    <List>
      <ExerciseBlocks items={workout.exercises}>
        {(e, index) => (
        <ListRow
          key={index}
          lead={
            e.done ? (
              <CheckIcon
                className='size-4'
                strokeWidth={2.5}
              />
            ) : (
              <MinusIcon className='text-foreground/30 size-4' />
            )
          }
          title={e.name}
        >
          <Poster
            size='xs'
            tone='soft'
            className='mt-1 tracking-[0.01em]'
          >
            {lastText({ date: workout.date, sets: e.sets }) ?? (e.done ? 'без записи подходов' : 'пропущено')}
          </Poster>
        </ListRow>
        )}
      </ExerciseBlocks>
    </List>
  </ScreenSection>
)
