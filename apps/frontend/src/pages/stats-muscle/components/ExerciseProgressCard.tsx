import type { StatsMuscleExercise } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'

const kg = (value: number) => value.toString().replace('.', ',')

// Упражнение на мышцу: «было → стало» и ступенька лучшего веса по тренировкам
export const ExerciseProgressCard = ({ exercise }: { exercise: StatsMuscleExercise }) => {
  const delta = exercise.last - exercise.first
  const single = exercise.points.length < 2

  return (
    <article className='border-border flex flex-col gap-2 border-b-[1.5px] px-gutter pb-5'>
      <Poster
        as='h2'
        size='sm'
      >
        {exercise.name}
      </Poster>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <Poster
          size='3xl'
          numeric
        >
          {single ? kg(exercise.last) : `${kg(exercise.first)} → ${kg(exercise.last)}`}
          <Unit>кг</Unit>
        </Poster>
        {!single && (
          <Eyebrow tone={delta > 0 ? 'primary' : 'inherit'}>
            {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
            {kg(Math.abs(Number(delta.toFixed(2))))} кг · рекорд {kg(exercise.best)}
          </Eyebrow>
        )}
      </div>
      {single ? (
        <Text
          size='sm'
          tone='muted'
        >
          Пока одна тренировка — график появится после следующей.
        </Text>
      ) : (
        <StepChart
          data={exercise.points.map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))}
          unit='кг'
          className='-mx-2'
        />
      )}
    </article>
  )
}
