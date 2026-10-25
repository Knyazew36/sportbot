import { pluralize } from '@front-cmdt/utils/pluralize'
import { ArrowRightIcon } from 'lucide-react'
import { Navigate } from 'react-router'

import { type Cooldown } from '@sportbot/api/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { StretchMuscles } from './StretchMuscles'

export const OfferView = ({ cooldown }: { cooldown: Cooldown }) => {
  const summary = buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId: cooldown.workoutId })
  const count = cooldown.main.length + cooldown.optional.length
  // Растяжек под эти мышцы нет — предлагать нечего, сразу итог
  if (!count)
    return (
      <Navigate
        to={summary}
        replace
      />
    )

  return (
    <Screen
      footer={
        <StickyFooter>
          <ButtonLink
            to={summary}
            replace
            variant='outline'
            size='lg'
          >
            Пропустить
          </ButtonLink>
          {/* Сразу к первой растяжке: обзор списка здесь был бы вторым предложением подряд */}
          <ButtonLink
            to={`${buildPath(ROUTES.COOLDOWN, { workoutId: cooldown.workoutId })}?start=1`}
            replace
            size='lg'
          >
            Начать
            <ArrowRightIcon
              className='size-7'
              strokeWidth={2.5}
            />
          </ButtonLink>
        </StickyFooter>
      }
      className='px-gutter'
    >
      <Rise className='flex flex-1 flex-col justify-center'>
        <Lead>тренировка засчитана, теперь —</Lead>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          className='mt-1'
        >
          заминка
        </Poster>
        <Poster
          size='xl'
          numeric
          className='mt-4'
        >
          ~{cooldown.minutes} мин · {pluralize(count, ['растяжка', 'растяжки', 'растяжек'])}
        </Poster>
        <StretchMuscles stretches={cooldown.main} />

        <div className='sb-lanes mt-6 h-20 opacity-30' />
      </Rise>
    </Screen>
  )
}

// Сразу после «Завершить» (frontend-tz, 9): один вопрос — растянуться сейчас или к итогу
