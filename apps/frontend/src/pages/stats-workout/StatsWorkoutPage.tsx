import { pluralize } from '@front-cmdt/utils/pluralize'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { useDeleteWorkout, useWorkout, useWorkoutSummary } from '@/entities/workout'
import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords'
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming'
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol'

// Прошедшая тренировка из календаря посещений: что сделано, рекорды того дня, время, протокол.
// В отличие от итога сразу после тренировки здесь нет серии и заминки — только разбор и правка
const StatsWorkoutPage = () => {
  const workoutId = Number(useParams().workoutId)
  const [params] = useSearchParams()
  const month = params.get('month')
  // Пришли с разводящей дня (в тот день тренировок несколько) — туда и возвращаемся
  const day = params.get('day')
  const navigate = useNavigate()
  const summary = useWorkoutSummary(workoutId)
  const workout = useWorkout(workoutId)
  const remove = useDeleteWorkout()
  // Назад — на разводящую дня или в посещения на тот же месяц календаря
  const back = day
    ? buildPath(ROUTES.STATS_DAY, { date: day })
    : `${ROUTES.STATS}?tab=attendance${month ? `&month=${month}` : ''}`

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={summary.data?.complexName ?? 'Тренировка'}
          subtitle={workout.data ? formatDate(workout.data.date, 'EEEE, d MMMM') : undefined}
        />
      }
      footer={
        summary.data && (
          <StickyFooter className='grid grid-cols-[1fr_auto] gap-2'>
            <ShareWorkoutButton
              workoutId={workoutId}
              size='lg'
            />
            <ConfirmAction
              trigger={
                <Button
                  variant='outline'
                  size='lg'
                  aria-label='Удалить тренировку'
                />
              }
              title='Удалить тренировку?'
              description='Подходы пропадут из статистики, а день в календаре станет пропуском.'
              confirmLabel='Удалить'
              onConfirm={() => remove.mutateAsync(workoutId).then(() => navigate(back, { replace: true }))}
            >
              <Trash2Icon />
            </ConfirmAction>
          </StickyFooter>
        )
      }
      className='gap-8 pb-10'
    >
      <QueryScreen query={summary}>
        {s => (
          <>
            <Rise className='px-gutter'>
              <Lead>тренировка</Lead>
              <Poster
                as='h1'
                size='3xl'
                tone='primary'
                fit
              >
                {workout.data ? formatDate(workout.data.date, 'd MMMM') : s.complexName}
              </Poster>
            </Rise>

            <Rise className='px-gutter flex flex-col gap-3'>
              <StatGrid
                framed
                items={[
                  { label: pluralize(s.sets, SET_FORMS, { withCount: false }), value: s.sets },
                  {
                    label: pluralize(s.exercisesTotal, EXERCISE_FORMS, { withCount: false }),
                    value: `${s.exercisesDone}/${s.exercisesTotal}`,
                  },
                  { label: 'минут', value: s.minutes },
                ]}
              />
              {s.tonnage > 0 && (
                <Text
                  size='sm'
                  tone='soft'
                >
                  Поднято за тренировку: {s.tonnage.toLocaleString('ru-RU')} кг
                </Text>
              )}
              {s.cardioName && (
                <Text
                  size='sm'
                  tone='soft'
                >
                  Кардио в конце: {s.cardioName}
                  {s.cardioMinutes ? `, ${s.cardioMinutes} мин` : ''}
                </Text>
              )}
              {/* Подходы есть — их можно поправить; в простом режиме править нечего */}
              {s.sets > 0 && (
                <ButtonLink
                  // Те же day/month — правка вернёт сюда же, а отсюда — туда, откуда пришли
                  to={`${buildPath(ROUTES.WORKOUT_EDIT, { workoutId })}?${params.toString()}`}
                  variant='outline'
                  className='w-full'
                >
                  <PencilIcon />
                  Исправить подходы
                </ButtonLink>
              )}
            </Rise>

            {s.records.length > 0 && (
              <ScreenSection
                title='Рекорды'
                aside={s.records.length}
              >
                <WorkoutRecords records={s.records} />
              </ScreenSection>
            )}

            {s.timing && <SummaryTiming timing={s.timing} />}

            <WorkoutProtocol workoutId={workoutId} />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default StatsWorkoutPage
