import type { SharedWorkout } from '@/entities/workout'
import { formatDate } from '@/shared/lib/format'
import { MedalArt } from '@/shared/ui/kit/Art'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'

const duration = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}` : `${minutes} мин`

// Шапка результата: чья тренировка, когда, сколько длилась, серия на медали
export const ResultHero = ({ workout }: { workout: SharedWorkout }) => (
  <Rise className='relative overflow-hidden px-gutter'>
    <div className='sb-halftone absolute -top-10 -left-16 size-64 rounded-full opacity-20' />
    <Lead className='relative'>{workout.isOwn ? 'твоя тренировка' : workout.authorName}</Lead>
    <Poster
      as='h1'
      size='display'
      tone='primary'
      fit
      className='relative'
    >
      {workout.complexName}
    </Poster>
    <Eyebrow
      as='p'
      className='relative mt-1'
    >
      {formatDate(workout.date, 'd MMMM yyyy')}
    </Eyebrow>
    <div className='relative mt-3 flex items-end justify-between gap-4'>
      <div>
        <Eyebrow as='p'>Время</Eyebrow>
        <Poster
          size='5xl'
          numeric
          className='mt-1'
        >
          {duration(workout.minutes)}
        </Poster>
      </div>
      <div className='relative w-[min(118px,30vw)] shrink-0'>
        <MedalArt />
        <Poster
          as='span'
          size='2xl'
          tone='primary'
          className='absolute inset-x-0 top-[50%] text-center'
        >
          {workout.currentStreak}
        </Poster>
      </div>
    </div>
  </Rise>
)
