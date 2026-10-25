import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  currentItem,
  type SetTiming,
  supersetDoneWith,
  supersetLabels,
  supersetRound,
  useDiscardWorkout,
  useFinishWorkout,
  useQueuedWorkout,
  useWarmupFinish,
  type Workout,
  type WorkoutItem,
} from '@sportbot/api/entities/workout';
import { useIsOnline } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { useStopwatch } from '@/shared/lib/hooks/use-stopwatch';
import { local } from '@/shared/lib/local';
import { haptic } from '@/shared/lib/haptics';
import { timerEndSignal } from '@/shared/lib/signal';

import type { EditingSet } from '@/widgets/workout/EditSetSheet';

import type { NextMode } from '../components/WorkoutActions';

/** Флаг в хранилище: переживает уход с экрана и перезапуск */
const useStoredFlag = (key: string) => {
  const [value, setValue] = useState(() => local.get(key) !== null);
  const set = (next: boolean) => {
    setValue(next);
    if (next) local.set(key, '1');
    else local.remove(key);
  };
  return [value, set] as const;
};

/**
 * Логика экрана идущей тренировки: какое упражнение на экране, разминка, подход, круг суперсета,
 * отдых и завершение. Без разметки — экран только показывает состояние и вызывает действия.
 * active = null — в тренировке нет упражнений
 */
export const useWorkoutFlow = (saved: Workout) => {
  const router = useRouter();
  const { workout, finishing } = useQueuedWorkout(saved);
  const online = useIsOnline();
  const finish = useFinishWorkout();
  const discard = useDiscardWorkout();
  const { settings } = workout;

  const pickedKey = `workout-picked-${saved.id}`;
  const [pickedId, setPickedIdState] = useState<number | null>(() => Number(local.get(pickedKey)) || null);
  const setPickedId = (id: number) => {
    setPickedIdState(id);
    local.set(pickedKey, String(id));
  };

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditingSet | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [restHidden, setRestHidden] = useState(false);
  const timer = useDeadlineTimer({
    storageKey: `rest-timer-${workout.id}`,
    onEnd: () => timerEndSignal(settings),
  });
  const stopwatch = useStopwatch({ storageKey: `set-stopwatch-${workout.id}` });
  const restTargetKey = `set-rest-target-${workout.id}`;
  const [roundActive, setRoundActive] = useStoredFlag(`round-active-${workout.id}`);
  const [entryFor, setEntryFor] = useState<number | null>(null);
  const [roundOpen, setRoundOpen] = useState(false);
  const warmupKey = `warmup-done-${workout.id}`;
  const [warmupEnded, setWarmupEnded] = useState(() => local.get(warmupKey) !== null);
  const warmupHiddenKey = `warmup-hidden-${workout.id}`;
  const [warmupHidden, setWarmupHidden] = useStoredFlag(warmupHiddenKey);
  const warmupFinish = useWarmupFinish();
  const warmupTimer = useDeadlineTimer({
    storageKey: `warmup-timer-${workout.id}`,
    onEnd: () => timerEndSignal(settings),
  });
  const warmupMinutes =
    workout.warmupMinutes && !workout.warmupFinishedAt && !warmupEnded && !workout.exercises.some((e) => e.sets.length)
      ? workout.warmupMinutes
      : null;
  const { status: warmupStatus, start: startWarmup } = warmupTimer;

  useEffect(() => {
    if (!warmupMinutes || warmupStatus !== 'idle') return;
    const passed = Math.floor((Date.now() - Date.parse(workout.startedAt)) / 1000);
    startWarmup(Math.max(1, warmupMinutes * 60 - passed));
  }, [warmupMinutes, warmupStatus, startWarmup, workout.startedAt]);

  const [stamp, setStamp] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const stampTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(stampTimer.current), []);
  const flashStamp = (text: string) => {
    clearTimeout(stampTimer.current);
    setStamp(text);
    stampTimer.current = setTimeout(() => setStamp(null), 900);
  };

  const items = workout.exercises;
  const item = items.find((e) => e.id === pickedId) ?? currentItem(items);
  const doneCount = items.filter((e) => e.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  const clearLocal = () => {
    timer.stop();
    stopwatch.stop();
    local.remove(restTargetKey);
    local.remove(warmupKey);
    local.remove(warmupHiddenKey);
    local.remove(pickedKey);
  };

  const onFinish = () => {
    clearLocal();
    finish.mutate({ id: workout.id, finishedAt: new Date().toISOString() });
  };

  const onDiscard = () =>
    discard.mutateAsync(workout.id).then(() => {
      clearLocal();
      router.replace(ROUTES.TODAY);
    });

  const base = {
    workout,
    finishing,
    online,
    items,
    doneCount,
    finishPending: finish.isPending,
    onFinish,
    onDiscard,
    stamp,
    editing,
    setEditing,
  };

  if (!item) return { ...base, active: null };

  const preview = items.find((e) => e.id === previewId) ?? null;
  const superset = supersetRound(items, item);
  const block = superset?.members ?? [item];
  const labels = superset ? supersetLabels(superset.members) : [];
  const labelOf = (id: number) => labels[block.findIndex((e) => e.id === id)];
  const entryItem = block.find((e) => e.id === entryFor) ?? item;
  const setNumber = entryItem.sets.length + 1;
  const focusTitle = superset ? `${labelOf(entryItem.id)} · ${entryItem.name}` : entryItem.name;
  const inRound = superset !== null && roundActive && superset.round.length > 1 && stopwatch.running;
  const restRunning = settings.showRestTimer && timer.status !== 'idle';
  const restOpen = restRunning && !restHidden;

  const lastIndex = items.indexOf(block.at(-1)!);
  const others = items.filter((e) => !block.includes(e) && !e.done);
  const nextId = (others.find((e) => items.indexOf(e) > lastIndex) ?? others[0])?.id;
  const nextMode: NextMode | null = others.length
    ? block.some((e) => e.sets.length)
      ? 'next'
      : 'skip'
    : doneCount
      ? 'finish'
      : null;

  const forward = allDone ? 'finish' : nextMode;
  const planDone = superset ? superset.done : item.plannedSets > 0 && item.sets.length >= item.plannedSets;

  const endWarmup = () => {
    if (!warmupMinutes) return;
    local.set(warmupKey, '1');
    local.remove(warmupHiddenKey);
    setWarmupEnded(true);
    warmupTimer.stop();
    warmupFinish.mutate(workout.id);
  };

  const onNext = () => {
    if (forward === 'finish') void onFinish();
    else if (nextId) setPickedId(nextId);
  };

  const startRest = (seconds: number) => {
    setRestHidden(false);
    timer.start(seconds);
  };

  const restAfterSet = () => {
    if (settings.showRestTimer && settings.restAutoStart) startRest(settings.restSeconds);
  };

  const restAfterManual = (timed: boolean) => {
    if (!timed && timer.status === 'idle') restAfterSet();
  };

  const backToSet = () => {
    if (!stopwatch.paused) return;
    timer.stop();
    stopwatch.resume();
  };

  const finishSuperset = (letter: string) => {
    haptic.success();
    flashStamp(`Суперсет ${letter} готов`);
    if (nextId) setPickedId(nextId);
  };

  const startSet = () => {
    endWarmup();
    if (timer.status !== 'idle') local.set(restTargetKey, String(timer.total));
    else local.remove(restTargetKey);
    timer.stop();
    if (superset) {
      const [first, second] = superset.round;
      if (!first) return;
      if (second) setRoundActive(true);
      else setEntryFor(first.id);
    }
    stopwatch.start();
  };

  const finishRound = () => {
    if (!superset) return;
    haptic.success();
    stopwatch.pause();
    restAfterSet();
    setBurstKey((k) => k + 1);
    flashStamp(`Круг ${superset.number} ✓`);
    setTimeout(() => setRoundOpen(true), 550);
  };

  const finishSet = () => {
    stopwatch.pause();
    restAfterSet();
    setEntryOpen(true);
  };

  const setTiming = (): SetTiming => {
    if (!stopwatch.running) return { doneAt: new Date().toISOString() };
    const restTarget = Number(local.get(restTargetKey));
    return {
      doneAt: new Date(stopwatch.pausedAt ?? Date.now()).toISOString(),
      workSeconds: stopwatch.elapsed,
      restTargetSeconds: restTarget > 0 ? restTarget : undefined,
    };
  };

  const cancelRound = () => {
    stopwatch.stop();
    setRoundActive(false);
  };

  const onRoundSaved = (addedIds: number[]) => {
    setRoundOpen(false);
    const timed = stopwatch.running;
    stopwatch.stop();
    local.remove(restTargetKey);
    setRoundActive(false);
    restAfterManual(timed);
    if (superset && supersetDoneWith(superset.members, addedIds)) finishSuperset(superset.letter);
  };

  const onSaved = () => {
    setEntryOpen(false);
    const timed = stopwatch.running;
    stopwatch.stop();
    local.remove(restTargetKey);
    setEntryFor(null);
    restAfterManual(timed);
    if (superset && supersetDoneWith(superset.members, [entryItem.id])) finishSuperset(superset.letter);
  };

  return {
    ...base,
    active: {
      item,
      block,
      superset,
      entryItem,
      setNumber,
      focusTitle,
      preview,
      forward,
      planDone,
      timer,
      stopwatch,
      warmupTimer,
      warmupMinutes,
      warmupHidden,
      restHidden,
      restRunning,
      restOpen,
      inRound,
      burstKey,
      entryOpen,
      roundOpen,
      setTiming,
      startSet,
      finishSet,
      finishRound,
      cancelRound,
      onNext,
      onSaved,
      onRoundSaved,
      pickLane: (id: number) => {
        if (!block.some((e) => e.id === id)) setPreviewId(id);
      },
      closePreview: () => setPreviewId(null),
      goToPreview: () => {
        if (!preview) return;
        setPickedId(preview.id);
        setPreviewId(null);
      },
      addSet: () => {
        endWarmup();
        setEntryOpen(true);
      },
      addSetFor: (member: WorkoutItem) => {
        endWarmup();
        setEntryFor(member.id);
        setEntryOpen(true);
      },
      recordRound: () => {
        endWarmup();
        setRoundOpen(true);
      },
      closeEntry: () => {
        setEntryOpen(false);
        backToSet();
      },
      closeRound: () => {
        setRoundOpen(false);
        backToSet();
      },
      pickEntryItem: () => setPickedId(entryItem.id),
      restNow: () => startRest(settings.restSeconds),
      openRest: () => setRestHidden(false),
      hideRest: () => setRestHidden(true),
      nextFromRest: () => {
        setRestHidden(true);
        onNext();
      },
      openWarmup: () => setWarmupHidden(false),
      hideWarmup: () => setWarmupHidden(true),
      returnToFocus: () => {
        if (restRunning) setRestHidden(false);
        else if (warmupMinutes) setWarmupHidden(false);
      },
      targetReached: () => timerEndSignal(settings),
    },
  };
};

export type WorkoutFlow = ReturnType<typeof useWorkoutFlow>;
export type ActiveWorkout = NonNullable<WorkoutFlow['active']>;
