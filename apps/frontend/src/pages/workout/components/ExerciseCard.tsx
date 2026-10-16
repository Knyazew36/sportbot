import { BookOpenIcon, RepeatIcon, TriangleAlertIcon } from 'lucide-react'

import { lastText, planText, type WorkoutItem } from '@/entities/workout'
import { useIsOnline } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

type ExerciseCardProps = {
  item: WorkoutItem
  /** Карточка в ленте суперсета: «A1 из 2» */
  label?: string
}

// Текущее упражнение: название, ⚠️ при ограничении, план, прошлый результат, «Техника» и «Заменить» (frontend-tz, 8.1)
export const ExerciseCard = ({ item, label }: ExerciseCardProps) => {
  const last = lastText(item.last)
  // Аналоги и замена — только с сервера: без сети ссылка гасится, чтобы не вести на вечную загрузку
  const online = useIsOnline()
  const offlineLink = online ? undefined : 'pointer-events-none opacity-50'

  return (
    <>
      <Rise>
        <Eyebrow
          as='p'
          tone='primary'
        >
          {item.done ? 'Сделано' : item.replaced ? 'Замена на сегодня' : 'Текущее'}
          {label && ` · ${label}`}
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
            className={cn('mt-4 h-auto py-1.5 text-[12.5px]', offlineLink)}
            aria-disabled={!online}
            tabIndex={online ? undefined : -1}
          >
            <TriangleAlertIcon className='size-3.5' />
            нагружает {item.limitedZones.join(', ')} — {online ? 'заменить?' : 'заменить можно при сети'}
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
          className={offlineLink}
          aria-disabled={!online}
          tabIndex={online ? undefined : -1}
        >
          <RepeatIcon className='size-3.5' />
          {online ? 'Заменить' : 'Нужна сеть'}
        </ButtonLink>
      </Rise>
    </>
  )
}
