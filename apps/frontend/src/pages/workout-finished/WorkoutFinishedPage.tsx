import { ArrowRightIcon } from 'lucide-react'
import { Navigate, useParams } from 'react-router'

import { type Cooldown, useCooldown } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

// Мышцы основного блока без повторов: у растяжек они перечислены через запятую
const musclesOf = (cooldown: Cooldown) => [
  ...new Set(cooldown.main.flatMap(s => s.muscles.split(',').map(m => m.trim().toLowerCase())).filter(Boolean)),
]

const OfferView = ({ cooldown }: { cooldown: Cooldown }) => {
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

  const muscles = musclesOf(cooldown)

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
        {muscles.length > 0 && (
          <Text
            tone='soft'
            className='mt-3'
          >
            На мышцы, которые работали: {muscles.join(', ')}.
          </Text>
        )}
        <Text
          tone='soft'
          className='mt-1'
        >
          Таймер каждой растяжки запускаешь сам. Итог тренировки — после заминки.
        </Text>
        <div className='sb-lanes mt-6 h-20 opacity-30' />
      </Rise>
    </Screen>
  )
}

// Сразу после «Завершить» (frontend-tz, 9): один вопрос — растянуться сейчас или к итогу
const WorkoutFinishedPage = () => {
  const workoutId = Number(useParams().workoutId)
  const cooldown = useCooldown(workoutId)
  return <QueryScreen query={cooldown}>{data => <OfferView cooldown={data} />}</QueryScreen>
}

export default WorkoutFinishedPage
