import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Poster, Unit } from '@/shared/ui/kit/Typography'

import { PERIODS, type Period } from './periods'

type WeightProgressProps = {
  exercises: { value: string; label: string }[]
  exercise: string
  onExerciseChange: (exercise: string) => void
  period: Period
  onPeriodChange: (period: Period) => void
  data: { label: string; value: number }[]
}

// Прогресс рабочих весов по выбранному упражнению: лучший вес за тренировку, ступенькой
export const WeightProgress = ({
  exercises,
  exercise,
  onExerciseChange,
  period,
  onPeriodChange,
  data,
}: WeightProgressProps) => {
  const best = data.length ? Math.max(...data.map(p => p.value)) : undefined

  return (
    <ScreenSection
      title='Прогресс весов'
      aside='лучший вес за тренировку'
    >
      <SelectField
        options={exercises}
        value={exercise}
        onValueChange={onExerciseChange}
        ariaLabel='Упражнение'
      />
      <div className='mt-1 flex flex-wrap items-end justify-between gap-3'>
        <Poster
          size='3xl'
          numeric
        >
          {best?.toString().replace('.', ',') ?? '—'}
          <Unit>кг</Unit>
        </Poster>
        <Segmented
          options={PERIODS}
          value={period}
          onValueChange={onPeriodChange}
        />
      </div>
      <StepChart
        data={data}
        unit='кг'
        className='-mx-2'
      />
    </ScreenSection>
  )
}
