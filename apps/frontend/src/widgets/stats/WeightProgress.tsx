import { useState } from 'react'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SelectField } from '@/shared/ui/kit/SelectField'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Poster, Unit } from '@/shared/ui/kit/Typography'

const PERIODS = ['1 мес', '3 мес', 'Год'] as const

type WeightProgressProps = {
  exercises: { value: string; label: string }[]
  data: { label: string; value: number }[]
}

// Прогресс рабочих весов по выбранному упражнению: лучший вес за тренировку, ступенькой
export const WeightProgress = ({ exercises, data }: WeightProgressProps) => {
  const [exercise, setExercise] = useState(exercises[0]?.value ?? '')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('3 мес')
  const best = data.at(-1)?.value

  return (
    <ScreenSection
      title='Прогресс весов'
      aside='лучший вес за тренировку'
    >
      <SelectField
        options={exercises}
        value={exercise}
        onValueChange={setExercise}
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
          onValueChange={setPeriod}
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
