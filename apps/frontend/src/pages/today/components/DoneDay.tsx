import { ChartNoAxesColumnIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import type { DayToday } from '@/entities/day'
import { ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { MedalArt } from '@/shared/ui/kit/Art'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { OtherComplexSheet } from './OtherComplexSheet'

// Тренировка засчитана: серия крупно, до рекорда — подписью. Дальше — заминка (внизу),
// ещё одна тренировка (внеплановая, как в боте) или статистика
export const DoneDay = ({ day }: { day: DayToday }) => {
  const navigate = useNavigate()
  const [pickOpen, setPickOpen] = useState(false)
  const { current, best } = day.streak
  const left = best - current

  return (
    <>
      <Rise className='relative mx-auto w-[200px]'>
        <MedalArt />
        <Poster
          as='span'
          size='5xl'
          tone='primary'
          className='absolute inset-x-0 top-[52%] text-center'
        >
          {current}
        </Poster>
      </Rise>
      <Rise className='px-5 text-center'>
        <Eyebrow
          as='p'
          tone='primary'
        >
          Тренировка засчитана ✅
        </Eyebrow>
        {day.workout && (
          <Lead
            size='md'
            className='mt-2'
          >
            {day.workout.complexName}
          </Lead>
        )}
        <Poster
          as='h1'
          size='4xl'
          className='mt-3'
        >
          {pluralize(current, ['день', 'дня', 'дней'])}
          <br />
          подряд
        </Poster>
        <Lead
          size='md'
          tone='soft'
          className='mt-3'
        >
          {left > 0 ? `до рекорда — ${pluralize(left, ['день', 'дня', 'дней'])}` : 'это твой рекорд'}
        </Lead>
      </Rise>
      <Rise className='grid grid-cols-2 gap-2 px-5'>
        <Button
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
          disabled={!day.complexes.length}
          onClick={() => setPickOpen(true)}
        >
          <PlusIcon />
          Ещё одна тренировка
        </Button>
        <ButtonLink
          to={ROUTES.STATS}
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
        >
          <ChartNoAxesColumnIcon />
          Статистика
        </ButtonLink>
      </Rise>

      <OtherComplexSheet
        open={pickOpen}
        onOpenChange={setPickOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={-1}
        onPick={id => navigate(`${ROUTES.WORKOUT}?complexId=${id}`)}
      />
    </>
  )
}
