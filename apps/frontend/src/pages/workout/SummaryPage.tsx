import { ArrowRightIcon, CheckIcon, MinusIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { lastText, useWorkout, useWorkoutSummary, type WorkoutSummary } from '@/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { MedalArt } from '@/shared/ui/kit/Art'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'

// Протокол: что сделано по каждому упражнению
const Protocol = ({ workoutId }: { workoutId: number }) => {
  const workout = useWorkout(workoutId)
  return (
    <ScreenSection title='Протокол'>
      <QueryScreen
        query={workout}
        className=''
        rows={3}
      >
        {w => (
          <List>
            {w.exercises.map(e => (
              <ListRow
                key={e.id}
                lead={
                  e.done ? (
                    <CheckIcon
                      className='size-4'
                      strokeWidth={2.5}
                    />
                  ) : (
                    <MinusIcon className='text-foreground/30 size-4' />
                  )
                }
                title={e.name}
              >
                <Poster
                  size='xs'
                  tone='soft'
                  className='mt-1 tracking-[0.01em]'
                >
                  {lastText({ date: w.date, sets: e.sets }) ?? (e.done ? 'без записи подходов' : 'не делал')}
                </Poster>
              </ListRow>
            ))}
          </List>
        )}
      </QueryScreen>
    </ScreenSection>
  )
}

const SummaryView = ({ summary }: { summary: WorkoutSummary }) => (
  <Screen
    header={
      <ScreenHeader
        title='Финиш'
        aside={summary.complexName}
      />
    }
    footer={
      <StickyFooter className='block'>
        <Lead
          size='sm'
          tone='soft'
          className='mb-3 text-center'
        >
          немного растяжки — и домой
        </Lead>
        <div className='grid grid-cols-2 gap-2'>
          <ButtonLink
            to={ROUTES.TODAY}
            variant='outline'
            size='lg'
            className='min-w-0 px-3'
          >
            Домой
          </ButtonLink>
          <ButtonLink
            to={buildPath(ROUTES.COOLDOWN, { workoutId: summary.workoutId })}
            size='lg'
            className='min-w-0 px-3'
          >
            Заминка
            <ArrowRightIcon
              className='size-6'
              strokeWidth={2.5}
            />
          </ButtonLink>
        </div>
      </StickyFooter>
    }
  >
    <Rise className='relative overflow-hidden px-gutter'>
      <div className='sb-halftone absolute -top-10 -left-16 size-64 rounded-full opacity-20' />
      <Lead className='relative'>тренировка</Lead>
      <Poster
        as='h1'
        size='display'
        tone='primary'
        className='relative'
      >
        {summary.status === 'IN_PROGRESS' ? 'идёт' : 'засчи­тана'}
      </Poster>
      <div className='relative mt-2 flex justify-end'>
        <div className='relative w-[min(118px,30vw)] shrink-0'>
          <MedalArt />
          <Poster
            as='span'
            size='2xl'
            tone='primary'
            className='absolute inset-x-0 top-[50%] text-center'
          >
            {summary.currentStreak}
          </Poster>
        </div>
      </div>
    </Rise>

    <Rise className='px-gutter'>
      <StatGrid
        framed
        items={[
          { label: 'подходов', value: summary.sets },
          { label: 'упражнений', value: `${summary.exercisesDone}/${summary.exercisesTotal}` },
          { label: 'серия', value: pluralize(summary.currentStreak, ['день', 'дня', 'дней']) },
        ]}
      />
      {summary.tonnage > 0 && (
        <Text
          size='sm'
          tone='soft'
          className='mt-3'
        >
          Поднято за тренировку: {summary.tonnage.toLocaleString('ru-RU')} кг
        </Text>
      )}
      {summary.cardioName && (
        <Text
          size='sm'
          tone='soft'
          className='mt-1'
        >
          Кардио после комплекса: {summary.cardioName}
          {summary.cardioMinutes ? `, ${summary.cardioMinutes} мин` : ''}
        </Text>
      )}
      {summary.status !== 'IN_PROGRESS' && (
        <ShareWorkoutButton
          workoutId={summary.workoutId}
          className='mt-4 w-full'
        />
      )}
    </Rise>

    <Protocol workoutId={summary.workoutId} />
  </Screen>
)

// Итог тренировки (frontend-tz, 8.6): время, подходы, серия, кнопка «Заминка»
const SummaryPage = () => {
  const workoutId = Number(useParams().workoutId)
  const summary = useWorkoutSummary(workoutId)

  return <QueryScreen query={summary}>{data => <SummaryView summary={data} />}</QueryScreen>
}

export default SummaryPage
