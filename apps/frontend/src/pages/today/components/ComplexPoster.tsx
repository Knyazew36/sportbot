import type { DayToday } from '@/entities/day'
import { BarbellArt } from '@/shared/ui/kit/Art'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'

type ComplexPosterProps = {
  complex: NonNullable<DayToday['complex']>
  complexes: DayToday['complexes']
}

// Плакат комплекса дня: первое слово огромным кеглем, остальное строкой ниже
export const ComplexPoster = ({ complex, complexes }: ComplexPosterProps) => {
  const index = complexes.findIndex(c => c.id === complex.id)
  const [head, ...tail] = complex.name.split(' ')
  const sets = complex.exercises.reduce((sum, e) => sum + e.sets, 0)

  return (
    <Rise className='relative px-gutter'>
      <Lead>{complex.byQueue ? 'сегодня на очереди —' : 'сегодня вне очереди —'}</Lead>
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
      <BarbellArt className='-mx-gutter mt-2 w-[calc(100%+2*var(--spacing-gutter))]' />
      <StatGrid
        className='mt-1'
        items={[
          { label: pluralize(complex.exercises.length, EXERCISE_FORMS, { withCount: false }), value: complex.exercises.length },
          { label: pluralize(sets, SET_FORMS, { withCount: false }), value: sets },
          { label: 'в очереди', value: `${index + 1}/${complexes.length}` },
        ]}
      />
    </Rise>
  )
}
