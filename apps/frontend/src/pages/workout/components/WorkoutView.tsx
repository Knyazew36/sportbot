import { pluralize } from '@front-cmdt/utils/pluralize'

import type { Workout } from '@sportbot/api/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Stamp } from '@/shared/ui/kit/Stamp'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'
import { EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { useWorkoutFlow } from '../model/use-workout-flow'
import { ElapsedInline } from './ElapsedInline'
import { EmptyWorkout } from './EmptyWorkout'
import { ExerciseCard } from './ExerciseCard'
import { FinishPending } from './FinishPending'
import { RoundEntrySheet } from './RoundEntrySheet'
import { SetEntrySheet } from './SetEntrySheet'
import { SupersetScreen } from './SupersetScreen'
import { SyncStatus } from './SyncStatus'
import { WorkoutActions } from './WorkoutActions'
import { WorkoutFocus } from './WorkoutFocus'
import { WorkoutLanes } from './WorkoutLanes'

// Экран идущей тренировки (frontend-tz, 8): спокойный экран упражнения, а подход и отдых — на весь экран поверх него
export const WorkoutView = ({ workout: saved }: { workout: Workout }) => {
  const flow = useWorkoutFlow(saved)
  const { workout, active, doneCount, items, online } = flow

  // Завершение в очереди: тренировки для человека уже нет, ждём сервер или уходим на «Сегодня»
  if (flow.finishing) return <FinishPending />

  if (!active)
    return (
      <EmptyWorkout
        title={workout.complexName}
        online={online}
        onDiscard={flow.onDiscard}
      />
    )

  const { item, superset, block } = active
  const { settings } = workout

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        // Внутри суперсета экран не пересоздаётся: лента карточек и её прокрутка живут, пока идёт суперсет
        key={superset ? `s${superset.superset}` : item.id}
        header={
          <>
            <TopBar
              back={ROUTES.TODAY}
              title={workout.complexName}
              subtitle={<ElapsedInline startedAt={workout.startedAt} />}
              action={
                // Засчитывается, если сделано хотя бы одно упражнение (business-tz, 7.3)
                <ConfirmAction
                  trigger={
                    <Button
                      variant='success'
                      size='sm'
                      // Засчитывать нечего — остаётся только отмена, а она без сети невозможна
                      disabled={!doneCount && !online}
                    />
                  }
                  title={doneCount ? 'Завершить тренировку?' : 'Засчитывать нечего'}
                  description={
                    doneCount
                      ? `Сделано ${doneCount} из ${pluralize(items.length, EXERCISE_OF_FORMS)}. Тренировка засчитается.`
                      : 'Пока не сделано ни одного упражнения. Можно отменить тренировку — очередь тренировок не сдвинется.'
                  }
                  confirmLabel={doneCount ? 'Завершить' : 'Отменить тренировку'}
                  confirmVariant={doneCount ? 'default' : 'destructive'}
                  onConfirm={doneCount ? flow.onFinish : flow.onDiscard}
                >
                  Завершить
                </ConfirmAction>
              }
            />
            <SyncStatus />
            <WorkoutLanes
              items={items}
              currentId={item.id}
              onPick={active.pickLane}
            />
          </>
        }
        footer={
          <WorkoutActions
            planDone={active.planDone}
            next={active.forward}
            nextPending={flow.finishPending}
            // Отдых сам стартует после подхода — тогда ручная кнопка лишняя
            restSeconds={
              settings.showRestTimer && !settings.restAutoStart && block.some(e => e.sets.length)
                ? settings.restSeconds
                : null
            }
            round={superset ? (superset.done ? null : superset.number) : undefined}
            onRecordRound={active.recordRound}
            onStartSet={active.startSet}
            restLeft={active.restRunning && active.restHidden ? active.timer.left : null}
            warmupLeft={active.warmupMinutes && active.warmupHidden ? active.warmupTimer.left : null}
            onWarmupOpen={active.openWarmup}
            onRest={active.restNow}
            onRestOpen={active.openRest}
            onNext={active.onNext}
          />
        }
        className='gap-6 px-gutter'
      >
        {superset ? (
          <SupersetScreen
            round={superset}
            onEdit={flow.setEditing}
            onAddSet={active.addSetFor}
          />
        ) : (
          <>
            <ExerciseCard item={item} />
            <SetList
              item={item}
              onEdit={flow.setEditing}
              onAdd={active.addSet}
            />
          </>
        )}
      </Screen>
      <WorkoutFocus
        flow={active}
        startedAt={workout.startedAt}
      />
      <SetEntrySheet
        open={active.entryOpen}
        onClose={active.closeEntry}
        item={active.entryItem}
        timing={active.setTiming}
        onSubmitStart={active.pickEntryItem}
        onSaved={active.onSaved}
      />
      <RoundEntrySheet
        open={active.roundOpen}
        round={superset}
        timing={active.setTiming}
        onClose={active.closeRound}
        onSaved={active.onRoundSaved}
      />
      <ExerciseSheet
        exercise={active.preview && { id: active.preview.exerciseId, name: active.preview.name }}
        onOpenChange={open => !open && active.closePreview()}
        action={
          active.preview && (
            <Button
              size='lg'
              className='w-full'
              onClick={active.goToPreview}
            >
              Перейти к упражнению
            </Button>
          )
        }
      />
      <Stamp text={flow.stamp} />
      <EditSetSheet
        editing={flow.editing}
        onClose={() => flow.setEditing(null)}
      />
    </div>
  )
}
