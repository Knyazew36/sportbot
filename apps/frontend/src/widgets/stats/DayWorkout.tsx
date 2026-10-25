import type { StatsDay } from '@sportbot/api/entities/stats'
import { durationText, isTimed, type Measure } from '@sportbot/api/lib/measure'
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'

// «50 × 10, 10, 9» — вес один на все подходы; иначе каждый подход «вес × повторы». Без веса — только повторы,
// на время — «45 с, 50 с»
const setsText = (sets: { weight: number; reps: number }[], measure: Measure) => {
  if (!sets.length) return '—'
  if (isTimed(measure)) return sets.map(s => durationText(s.reps)).join(', ')
  const weights = new Set(sets.map(s => s.weight))
  const reps = sets.map(s => s.reps).join(', ')
  if (weights.size === 1) {
    const [w] = weights
    return w ? `${String(w).replace('.', ',')} × ${reps}` : reps
  }
  return sets.map(s => (s.weight ? `${String(s.weight).replace('.', ',')}×${s.reps}` : s.reps)).join(', ')
}

type DayWorkoutProps = { workout: StatsDay['workouts'][number] }

// Одна тренировка дня: комплекс и подходы по упражнениям — в календаре посещений и в шторке серии
export const DayWorkout = ({ workout }: DayWorkoutProps) => (
  <div>
    <div className='mb-2 flex items-center justify-between gap-3'>
      <Text
        size='sm'
        tone='muted'
      >
        {workout.complexName}
        {workout.unplanned && ' · внеплановая'}
      </Text>
    </div>
    <List>
      <ExerciseBlocks items={workout.exercises}>
        {e => (
          <ListRow
            key={e.name}
            title={
              <Text
                as='span'
                size='sm'
                tone={e.done ? 'inherit' : 'muted'}
              >
                {e.name}
              </Text>
            }
            trail={
              <Poster
                as='span'
                size='xs'
                tone='soft'
                className='whitespace-nowrap'
              >
                {setsText(e.sets, e.measure)}
              </Poster>
            }
            className='py-2'
          />
        )}
      </ExerciseBlocks>
    </List>
  </div>
)
