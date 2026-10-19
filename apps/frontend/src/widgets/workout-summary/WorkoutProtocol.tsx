import { CheckIcon, MinusIcon } from 'lucide-react'

import { lastText, useWorkout } from '@/entities/workout'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster } from '@/shared/ui/kit/Typography'

// Протокол: что сделано по каждому упражнению — в итоге тренировки и на её странице из календаря
export const WorkoutProtocol = ({ workoutId }: { workoutId: number }) => {
  const workout = useWorkout(workoutId)
  return (
    <ScreenSection title='Протокол'>
      <QueryScreen
        query={workout}
        className=''
        rows={3}
      >
        {w => (
          <List>
            <ExerciseBlocks items={w.exercises}>
              {e => (
                <ListRow
                  key={e.id}
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
                    {lastText({ date: w.date, sets: e.sets }, e.measure) ?? (e.done ? 'без записи подходов' : 'не делал')}
                  </Poster>
                </ListRow>
              )}
            </ExerciseBlocks>
          </List>
        )}
      </QueryScreen>
    </ScreenSection>
  )
}
