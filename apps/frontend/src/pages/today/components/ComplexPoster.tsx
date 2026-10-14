import type { DayToday } from '@/entities/day'
import { BarbellArt } from '@/shared/ui/kit/Art'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'

import { complexLetter } from './complex-letter'

type ComplexPosterProps = {
  complex: NonNullable<DayToday['complex']>
  complexes: DayToday['complexes']
  programName: string | null
}

// Плакат комплекса дня: первое слово огромным кеглем, остальное строкой ниже
export const ComplexPoster = ({ complex, complexes, programName }: ComplexPosterProps) => {
  const index = complexes.findIndex(c => c.id === complex.id)
  const [head, ...tail] = complex.name.split(' ')
  const sets = complex.exercises.reduce((sum, e) => sum + e.sets, 0)

  return (
    <Rise className='relative px-5'>
      <Eyebrow as='p'>
        Комплекс {complexLetter(Math.max(index, 0))}
        {programName && ` · ${programName}`}
      </Eyebrow>
      <Lead className='mt-4'>{complex.byQueue ? 'сегодня на очереди —' : 'сегодня вне очереди —'}</Lead>
      <Poster
        as='h1'
        size='hero'
        tone='primary'
        fit
        className='mt-1'
      >
        {head}
      </Poster>
      {tail.length > 0 && (
        <Poster
          size='3xl'
          className='mt-2'
        >
          {tail.join(' ')}
        </Poster>
      )}
      <BarbellArt className='-mx-5 mt-2 w-[calc(100%+2.5rem)]' />
      <StatGrid
        className='mt-1'
        items={[
          { label: 'упражнений', value: complex.exercises.length },
          { label: 'подходов', value: sets },
          { label: 'в очереди', value: `${index + 1}/${complexes.length}` },
        ]}
      />
    </Rise>
  )
}
