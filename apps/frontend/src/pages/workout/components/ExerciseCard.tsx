import { BookOpenIcon, RepeatIcon, TriangleAlertIcon } from 'lucide-react'

import { lastText, planText, type WorkoutItem } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

type ExerciseCardProps = { item: WorkoutItem; index: number }

// Текущее упражнение: название, ⚠️ при ограничении, план, прошлый результат, «Техника» и «Заменить» (frontend-tz, 8.1)
export const ExerciseCard = ({ item, index }: ExerciseCardProps) => {
  const last = lastText(item.last)

  return (
    <>
      <Rise className='relative'>
        {/* Номер упражнения контуром — как номер на стартовом нагруднике */}
        <Poster
          as='span'
          size='hero'
          numeric
          className='pointer-events-none absolute -top-3 -right-2 text-[min(170px,40vw)] text-transparent opacity-40 select-none'
          style={{ WebkitTextStroke: '1.5px var(--sb-blue)' }}
          aria-hidden
        >
          {String(index + 1).padStart(2, '0')}
        </Poster>
        <Eyebrow
          as='p'
          tone='primary'
          className='relative'
        >
          {item.done ? 'Сделано' : item.replaced ? 'Замена на сегодня' : 'Текущее'}
          {item.draft && ' · не проверено'}
        </Eyebrow>
        <Poster
          as='h1'
          size='2xl'
          className='relative mt-3 max-w-[80%] hyphens-auto'
        >
          {item.name}
        </Poster>
        {item.muscles && (
          <Text
            size='sm'
            tone='soft'
            className='relative mt-2'
          >
            {item.muscles}
          </Text>
        )}
        {item.limitedZones.length > 0 && (
          <ButtonLink
            to={buildPath(ROUTES.WORKOUT_REPLACE, { itemId: item.id })}
            variant='alert'
            size='sm'
            className='relative mt-4 h-auto py-1.5 text-[12.5px]'
          >
            <TriangleAlertIcon className='size-3.5' />
            нагружает {item.limitedZones.join(', ')} — заменить?
          </ButtonLink>
        )}
      </Rise>

      {/* Справка, а не действие: светлая рамка без тени */}
      <Rise className='border-border grid grid-cols-2 border-[1.5px]'>
        <div className='border-border border-r-[1.5px] p-3'>
          <Eyebrow as='p'>План</Eyebrow>
          <Poster
            size='2xl'
            className='mt-2 text-[min(40px,9vw)] whitespace-nowrap'
          >
            {planText(item.plannedSets, item.repsMin, item.repsMax)}
          </Poster>
        </div>
        <div className='p-3'>
          <Eyebrow as='p'>Прошлый раз</Eyebrow>
          <Poster
            tone={last ? 'primary' : 'faint'}
            className='mt-2'
          >
            {last ?? 'первый раз'}
          </Poster>
        </div>
      </Rise>

      <Rise className='flex gap-3'>
        <ButtonLink
          to={`${buildPath(ROUTES.EXERCISE, { exerciseId: item.exerciseId })}?from=${ROUTES.WORKOUT}`}
          variant='outline'
          size='sm'
        >
          <BookOpenIcon className='size-3.5' />
          Техника
        </ButtonLink>
        <ButtonLink
          to={buildPath(ROUTES.WORKOUT_REPLACE, { itemId: item.id })}
          variant='outline'
          size='sm'
        >
          <RepeatIcon className='size-3.5' />
          Заменить
        </ButtonLink>
      </Rise>
    </>
  )
}
