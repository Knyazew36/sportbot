import { format } from 'date-fns';

import { currentItem, lastSetHint, supersetRound, weightText, type Workout, type WorkoutItem } from '@sportbot/api/entities/workout';
import { durationText, isTimed, rangeText } from '@sportbot/api/lib/measure';

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { local } from '@/shared/lib/local';

import { restTimerKey } from '@/widgets/live-workout-bar/constants';

import type { WorkoutLiveProps } from './types';

type Deadline = { status: 'running'; endsAt: number; total: number } | { status: 'paused'; left: number; total: number };
type Stopwatch = { startedAt: number; pausedAt: number | null };

// Ключи те же, что пишет экран тренировки (pages/workout/model/use-workout-flow): страницу отсюда импортировать нельзя
const stopwatchKey = (id: number) => `set-stopwatch-${id}`;
const pickedKey = (id: number) => `workout-picked-${id}`;
const warmupTimerKey = (id: number) => `warmup-timer-${id}`;
const warmupDoneKey = (id: number) => `warmup-done-${id}`;

/** Ключи хранилища, при смене которых экран блокировки пересобирается */
export const liveKeys = (id: number) => [
  restTimerKey(id),
  stopwatchKey(id),
  pickedKey(id),
  warmupTimerKey(id),
  warmupDoneKey(id),
];

const readJson = <T>(key: string): T | null => {
  const raw = local.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const hhmm = (ms: number) => format(ms, 'HH:mm');

/** Цель следующего подхода: план из программы, без плана — тот же подход в прошлый раз */
const targetOf = (item: WorkoutItem) => {
  if (item.repsMin > 0) {
    return `Цель ${rangeText(item.measure, item.repsMin, item.repsMax)}${isTimed(item.measure) ? '' : ' повт.'}`;
  }
  const last = lastSetHint(item.last, item.sets.length + 1);
  if (!last) return '';
  if (isTimed(item.measure)) return `Прошлый раз ${durationText(last.reps)}`;
  return `Прошлый раз ${last.weight === 0 ? 'свой вес' : weightText(last.weight)} × ${last.reps}`;
};

/** Где человек сейчас: упражнение, номер подхода и цель — как на экране тренировки */
const position = (workout: Workout) => {
  const items = workout.exercises;
  const picked = Number(local.get(pickedKey(workout.id))) || null;
  const item = items.find((e) => e.id === picked) ?? currentItem(items);
  if (!item) return { exercise: 'Добавьте упражнения', step: '', target: '' };

  const superset = supersetRound(items, item);
  if (superset) {
    // Имя упражнения круга отдельно: строка «А + Б + В» на экране блокировки обрезается
    const member = superset.round[0] ?? item;
    return {
      exercise: superset.done ? `Суперсет ${superset.letter}` : `${superset.letter} · ${member.name}`,
      step: superset.done ? 'Суперсет готов' : `Круг ${superset.number} из ${superset.rounds}`,
      target: superset.done ? '' : targetOf(member),
    };
  }
  if (!item.plannedSets) return { exercise: item.name, step: `Подход ${item.sets.length + 1}`, target: targetOf(item) };
  if (item.sets.length >= item.plannedSets) return { exercise: item.name, step: 'Подходы сделаны', target: '' };
  return {
    exercise: item.name,
    step: `Подход ${item.sets.length + 1} из ${item.plannedSets}`,
    target: targetOf(item),
  };
};

/** Подходы по плану: сделанное упражнение засчитываем целиком, сверх плана — растягиваем сегмент */
const setsProgress = (items: WorkoutItem[]) => {
  const segments = items.map((e) => Math.max(e.plannedSets, e.sets.length, 1));
  const done = items.reduce((sum, e, i) => sum + (e.done ? segments[i]! : Math.min(e.sets.length, segments[i]!)), 0);
  return { segments, setsDone: done, setsTotal: segments.reduce((sum, n) => sum + n, 0) };
};

/** Что показать на экране блокировки прямо сейчас. Таймеры читаем из хранилища — экран тренировки может быть закрыт */
export const liveProps = (workout: Workout, now: number): WorkoutLiveProps => {
  const { id, settings } = workout;
  const items = workout.exercises;
  const startedAt = Date.parse(workout.startedAt);
  const base = {
    workoutId: id,
    startedAt,
    title: workout.complexName || 'Тренировка',
    ...position(workout),
    done: items.filter((e) => e.done).length,
    total: items.length,
    ...setsProgress(items),
  };

  const rest = settings.showRestTimer ? readJson<Deadline>(restTimerKey(id)) : null;
  if (rest?.status === 'paused') {
    return {
      ...base,
      phase: 'rest',
      label: 'Отдых на паузе',
      from: now - (rest.total - rest.left) * 1000,
      to: now + rest.left * 1000,
      pausedAt: now,
      clock: `осталось ${formatSeconds(Math.ceil(rest.left))}`,
    };
  }
  if (rest?.status === 'running') {
    if (rest.endsAt > now) {
      return {
        ...base,
        phase: 'rest',
        label: 'Отдых',
        from: rest.endsAt - rest.total * 1000,
        to: rest.endsAt,
        pausedAt: null,
        clock: `до ${hhmm(rest.endsAt)}`,
      };
    }
    // Таймер не сбросили, а время вышло: считаем, сколько человек пересиживает
    return {
      ...base,
      phase: 'restOver',
      label: 'Пора к подходу',
      from: rest.endsAt,
      to: null,
      pausedAt: null,
      clock: `с ${hhmm(rest.endsAt)}`,
    };
  }

  const stopwatch = readJson<Stopwatch>(stopwatchKey(id));
  // На паузе секундомер ждёт записи подхода — это уже не «подход идёт»
  if (stopwatch && stopwatch.pausedAt === null) {
    return {
      ...base,
      phase: 'set',
      label: 'Подход идёт',
      from: stopwatch.startedAt,
      to: null,
      pausedAt: null,
      clock: `с ${hhmm(stopwatch.startedAt)}`,
    };
  }

  const warmup = readJson<Deadline>(warmupTimerKey(id));
  const warmupOn =
    workout.warmupMinutes && !workout.warmupFinishedAt && !local.get(warmupDoneKey(id)) && !items.some((e) => e.sets.length);
  if (warmupOn && warmup?.status === 'running' && warmup.endsAt > now) {
    return {
      ...base,
      step: 'Разминка',
      phase: 'warmup',
      label: 'Разминка',
      from: warmup.endsAt - warmup.total * 1000,
      to: warmup.endsAt,
      pausedAt: null,
      clock: `до ${hhmm(warmup.endsAt)}`,
    };
  }

  return {
    ...base,
    phase: 'workout',
    label: 'Тренировка идёт',
    from: startedAt,
    to: null,
    pausedAt: null,
    clock: `с ${hhmm(startedAt)}`,
  };
};

/** Ближайший момент, когда картинка поменяется сама, без записи в хранилище: конец отдыха или разминки */
export const nextChangeAt = (props: WorkoutLiveProps | null) =>
  props && props.to !== null && props.pausedAt === null ? props.to : null;
