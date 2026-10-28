import { View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';

import { pluralize } from '@front-cmdt/utils/pluralize';

import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Screen } from '@/shared/ui/kit/Screen';
import { Stamp } from '@/shared/ui/kit/Stamp';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Button } from '@/shared/ui/kit/Button';
import { ROUTES } from '@/shared/config/routes';
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';
import { SetList } from '@/widgets/workout/SetList';

import { useRestNotification } from '@/shared/lib/hooks/use-rest-notification';

import { useWorkoutFlow } from '../model/use-workout-flow';
import { ElapsedInline } from './ElapsedInline';
import { EmptyWorkout } from './EmptyWorkout';
import { ExerciseCard } from './ExerciseCard';
import { FinishPending } from './FinishPending';
import { RoundEntrySheet } from './RoundEntrySheet';
import { SetEntrySheet } from './SetEntrySheet';
import { SupersetScreen } from './SupersetScreen';
import { SyncStatus } from './SyncStatus';
import { WorkoutActions } from './WorkoutActions';
import { WorkoutFocus } from './WorkoutFocus';
import { WorkoutLanes } from './WorkoutLanes';
import { EditSetSheet } from '@/widgets/workout/EditSetSheet';
import { useWorkoutScreenBar } from '@/widgets/live-workout-bar/workout-screen-bar';

export const WorkoutView = ({ workout: saved }: { workout: import('@sportbot/api/entities/workout').Workout }) => {
  useKeepAwake();
  const flow = useWorkoutFlow(saved);
  useRestNotification(flow.active?.timer);
  const { workout, active, doneCount, items } = flow;
  // Полоса общая на приложение; без упражнений возвращаться не к чему — прячем
  useWorkoutScreenBar({ hidden: !active || active.focusOpen, onReturn: active?.returnToFocus });

  if (flow.finishing) return <FinishPending />;

  if (!active) return <EmptyWorkout title={workout.complexName} onDiscard={flow.onDiscard} />;

  const { item, superset, block } = active;
  const { settings } = workout;

  return (
    <View className="flex-1">
      <Screen
        key={superset ? `s${superset.superset}` : item.id}
        fullscreen
        scroll
        header={
          <>
            <TopBar
              back={() => router.replace(ROUTES.TODAY)}
              title={workout.complexName}
              subtitle={<ElapsedInline startedAt={workout.startedAt} />}
              action={
                <ConfirmAction
                  trigger={<Button variant="success" size="sm" />}
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
            <WorkoutLanes items={items} currentId={item.id} onPick={active.pickLane} />
          </>
        }
        footer={
          <WorkoutActions
            planDone={active.planDone}
            next={active.forward}
            nextPending={flow.finishPending}
            restSeconds={
              settings.showRestTimer && !settings.restAutoStart && block.some((e) => e.sets.length)
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
        className="gap-6 px-gutter"
      >
        {superset ? (
          <SupersetScreen round={superset} onEdit={flow.setEditing} onAddSet={active.addSetFor} />
        ) : (
          <>
            <ExerciseCard item={item} />
            <SetList item={item} onEdit={flow.setEditing} onAdd={active.addSet} />
          </>
        )}
      </Screen>
      <WorkoutFocus flow={active} startedAt={workout.startedAt} />
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
        onOpenChange={(open) => !open && active.closePreview()}
        action={
          active.preview && (
            <Button size="lg" block onPress={active.goToPreview}>
              Перейти к упражнению
            </Button>
          )
        }
      />
      <Stamp text={flow.stamp} />
      <EditSetSheet editing={flow.editing} onClose={() => flow.setEditing(null)} />
    </View>
  );
};
