import { isTimed } from '@sportbot/api/lib/measure';

import type { ActiveWorkout } from '../model/use-workout-flow';
import { FocusRest } from './FocusRest';
import { FocusRound } from './FocusRound';
import { FocusSet } from './FocusSet';
import { FocusWarmup } from './FocusWarmup';

type WorkoutFocusProps = {
  flow: ActiveWorkout;
  startedAt: string;
};

export const WorkoutFocus = ({ flow, startedAt }: WorkoutFocusProps) => {
  const { item, entryItem, superset } = flow;

  if (flow.warmupMinutes && !flow.warmupHidden)
    return <FocusWarmup timer={flow.warmupTimer} first={item} onClose={flow.hideWarmup} />;

  if (flow.inRound && superset)
    return (
      <FocusRound
        stopwatch={flow.stopwatch}
        round={superset}
        startedAt={startedAt}
        burstKey={flow.burstKey || undefined}
        onFinish={flow.finishRound}
        onRestart={flow.stopwatch.start}
        onCancel={flow.cancelRound}
      />
    );

  if (flow.stopwatch.running)
    return (
      <FocusSet
        stopwatch={flow.stopwatch}
        title={flow.focusTitle}
        startedAt={startedAt}
        setNumber={flow.setNumber}
        plannedSets={entryItem.plannedSets}
        target={
          isTimed(entryItem.measure)
            ? { min: entryItem.repsMin, max: entryItem.repsMax, measure: entryItem.measure }
            : undefined
        }
        onTarget={flow.targetReached}
        onDone={flow.finishSet}
      />
    );

  if (flow.restOpen)
    return (
      <FocusRest
        timer={flow.timer}
        title={superset ? `Суперсет ${superset.letter}` : flow.focusTitle}
        startedAt={startedAt}
        nextSet={flow.setNumber}
        plannedSets={item.plannedSets}
        round={superset && !superset.done ? { letter: superset.letter, number: superset.number, rounds: superset.rounds } : null}
        onToSet={flow.startSet}
        onClose={flow.hideRest}
        planDone={flow.planDone}
        next={flow.forward}
        onNext={flow.nextFromRest}
      />
    );

  return null;
};
