import { BookOpenIcon, RepeatIcon, TriangleAlertIcon } from 'lucide-react'

import { lastText, planText, type WorkoutItem } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

type ExerciseCardProps = { item: WorkoutItem }

// Текущее упражнение: название, ⚠️ при ограничении, план, прошлый результат, «Техника» и «Заменить» (frontend-tz, 8.1)
export const ExerciseCard = ({ item }: ExerciseCardProps) => {
  const last = lastText(item.last)

  return (
    <>
      <Rise>
        <Eyebrow
          as='p'
          tone='primary'
        >
          {item.done ? 'Сделано' : item.replaced ? 'Замена на сегодня' : 'Текущее'}
          {item.draft && ' · не проверено'}
        </Eyebrow>
        <Poster
          as='h1'
          size='2xl'
          className='mt-3 hyphens-auto'
        >
          {item.name}
        </Poster>
        {item.muscles && (
          <Text
            size='sm'
            tone='soft'
            className='mt-2'
          >
            {item.muscles}
          </Text>
        )}
        {item.limitedZones.length > 0 && (
          <ButtonLink
            to={buildPath(ROUTES.WORKOUT_REPLACE, { itemId: item.id })}
            variant='alert'
            size='sm'
            className='mt-4 h-auto py-1.5 text-[12.5px]'
          >
            <TriangleAlertIcon className='size-3.5' />
            нагружает {item.limitedZones.join(', ')} — заменить?
          </ButtonLink>
        )}
      </Rise>

      {/* Справка одной строкой: план и прошлый раз не спорят с подходами за внимание */}
      <Rise className='flex flex-wrap items-baseline gap-x-5 gap-y-1'>
        <Text size='sm'>
          <Eyebrow>План </Eyebrow>
          <Poster as='span' size='sm'>
            {planText(item.plannedSets, item.repsMin, item.repsMax)}
          </Poster>
        </Text>
        <Text size='sm'>
          <Eyebrow>Прошлый раз </Eyebrow>
          <Poster as='span' size='sm' tone={last ? 'primary' : 'faint'}>
            {last ?? 'первый раз'}
          </Poster>
        </Text>
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
