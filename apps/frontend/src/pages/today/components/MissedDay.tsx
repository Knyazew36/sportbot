import { type DayToday, useFixDay, useRescheduleAnswer } from '@sportbot/api/entities/day'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Notice } from '@/shared/ui/kit/Notice'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { NextUp } from './NextUp'
import { WeekStreak } from './WeekStreak'

type MissedDayProps = {
  day: DayToday
  /** Три пропуска подряд — после ответа «не буду» предложить паузу */
  suggestPause: boolean
}

// День отмечен пропуском. Исправить (business-tz, 8.3): тренировка была без записи — отметить её;
// или потренироваться сейчас (кнопка внизу экрана) — записанная тренировка сама закроет пропуск
export const MissedDay = ({ day, suggestPause }: MissedDayProps) => {
  const reschedule = useRescheduleAnswer()
  const fix = useFixDay()
  const dayId = day.dayId

  return (
    <>
      <Rise className='px-gutter'>
        <Lead>сегодня —</Lead>
        <Poster
          as='h1'
          size='hero'
          tone='primary'
          fit
        >
          пропуск
        </Poster>
        {day.streak.best > 0 && (
          <Lead
            size='md'
            tone='soft'
            className='mt-2'
          >
            серия прервалась · рекорд серии {day.streak.best} остаётся
          </Lead>
        )}
      </Rise>

      {dayId && (
        <Rise className='px-gutter'>
          <ConfirmAction
            title='Тренировка всё-таки была?'
            description='Отмечу день тренировкой дня по очереди, серия пересчитается.'
            confirmLabel='Отметить'
            confirmVariant='default'
            onConfirm={() => fix.mutateAsync({ dayId, status: 'DONE' })}
            trigger={
              <Button
                variant='outline'
                className='w-full'
              />
            }
          >
            Исправить: тренировка была
          </ConfirmAction>
        </Rise>
      )}

      {day.rescheduleOffered && (
        <Rise className='border-primary mx-gutter flex flex-col gap-3 border-[1.5px] p-4'>
          <Eyebrow tone='primary'>Перенос</Eyebrow>
          <Poster size='lg'>Напомнить завтра?</Poster>
          <Text
            size='sm'
            tone='soft'
          >
            Завтра утром бот спросит про тренировку, хоть день и не по расписанию.
          </Text>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              disabled={reschedule.isPending}
              onClick={() => reschedule.mutate(true)}
            >
              Да, завтра
            </Button>
            <Button
              variant='outline'
              disabled={reschedule.isPending}
              onClick={() => reschedule.mutate(false)}
            >
              Нет
            </Button>
          </div>
        </Rise>
      )}

      {suggestPause && (
        <Rise className='px-gutter'>
          <Notice
            kicker='три пропуска подряд'
            description='Можно поставить паузу — серия сохранится, бот помолчит.'
          >
            <ButtonLink
              to={buildPath(ROUTES.ME_SECTION, { section: 'training' })}
              variant='outline'
            >
              Поставить паузу
            </ButtonLink>
          </Notice>
        </Rise>
      )}

      <NextUp day={day} />

      <WeekStreak
        week={day.week}
      />
    </>
  )
}
