import type { DayToday } from '@/entities/day'
import { DAY_FORMS } from '@/shared/lib/plural-forms'
import { MedalArt } from '@/shared/ui/kit/Art'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

const MILESTONES = [7, 14, 30, 50, 100, 365]

// Подпись под серией: первая подходящая — первая тренировка, веха, рекорд серии, сколько до него
const streakNote = ({ current, best }: DayToday['streak']) => {
  if (best === 1) return 'первая тренировка — серия началась'
  if (MILESTONES.includes(current)) return `${pluralize(current, DAY_FORMS)} подряд — веха!`
  if (current >= best && current > 1) return 'новый рекорд серии'
  return `до рекорда серии — ${pluralize(best - current, DAY_FORMS)}`
}

// Засчитано: серия на медали крупно, подпись про рекорд серии
export const DoneHero = ({ day }: { day: DayToday }) => {
  const { current } = day.streak

  return (
    <>
      <Rise className='relative mx-auto w-[160px]'>
        <MedalArt />
        <Poster
          as='span'
          size='4xl'
          tone='primary'
          className='absolute inset-x-0 top-[52%] text-center'
        >
          {current}
        </Poster>
      </Rise>
      <Rise className='px-gutter text-center'>
        <Eyebrow
          as='p'
          tone='primary'
        >
          {day.workoutsToday > 1 ? `${day.workoutsToday} тренировки сегодня ✅` : 'Тренировка засчитана ✅'}
        </Eyebrow>
        <Poster
          as='h1'
          size='3xl'
          className='mt-3'
        >
          {pluralize(current, DAY_FORMS)} подряд
        </Poster>
        <Lead
          size='md'
          tone='soft'
          className='mt-2'
        >
          {streakNote(day.streak)}
        </Lead>
      </Rise>
    </>
  )
}
