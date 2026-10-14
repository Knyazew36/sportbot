import type { SharedWorkout } from '@/entities/workout'
import { pluralize } from '@/shared/lib/format'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'

// Цифры итога: подходы, упражнения, серия, тоннаж и кардио
export const ResultStats = ({ workout }: { workout: SharedWorkout }) => (
  <Rise className='px-gutter'>
    <StatGrid
      framed
      items={[
        { label: 'подходов', value: workout.sets },
        { label: 'упражнений', value: `${workout.exercisesDone}/${workout.exercisesTotal}` },
        { label: 'серия', value: pluralize(workout.currentStreak, ['день', 'дня', 'дней']) },
      ]}
    />
    {workout.tonnage > 0 && (
      <Text
        size='sm'
        tone='soft'
        className='mt-3'
      >
        Поднято за тренировку: {workout.tonnage.toLocaleString('ru-RU')} кг
      </Text>
    )}
    {workout.cardioName && (
      <Text
        size='sm'
        tone='soft'
        className='mt-1'
      >
        Кардио после комплекса: {workout.cardioName}
        {workout.cardioMinutes ? `, ${workout.cardioMinutes} мин` : ''}
      </Text>
    )}
  </Rise>
)
