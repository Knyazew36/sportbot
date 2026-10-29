import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { Keyboard, View } from 'react-native';

import { lastSetHint, newClientId, restText, type SetTiming, type TimeSetInput, timeSetSchema, weightText, type WorkoutItem, type WorkoutSetInput, workoutSetSchema, type WorkoutSetValues } from '@sportbot/api/entities/workout';
import { useAddSet } from '@/shared/local/entities/workout';
import { durationText, isTimed, timeInput, timeLabel } from '@sportbot/api/lib/measure';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { BoxInput } from '@/shared/ui/kit/BoxInput';

import { setCaption } from './set-caption';

type SetEntryFormProps = {
  item: WorkoutItem;
  onSubmit: (values: WorkoutSetValues) => void;
};

const SetEntryForm = ({ item, onSubmit }: SetEntryFormProps) => {
  const hint = lastSetHint(item.last, item.sets.length + 1);
  const { control, handleSubmit, formState } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: '', reps: '' },
  });

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <BoxInput large
              label={item.bodyweight ? 'вес, если есть' : 'вес, кг'}
              placeholder={hint ? weightText(hint.weight) : item.bodyweight ? 'свой' : '0'}
              keyboardType="decimal-pad"
              autoFocus={!item.bodyweight}
              {...field}
              onChangeText={field.onChange}
              value={field.value}
              className="flex-1 py-2"
            />
          )}
        />
        <Controller
          control={control}
          name="reps"
          render={({ field }) => (
            <BoxInput large
              label="повторы"
              placeholder={hint ? String(hint.reps) : String(item.repsMax)}
              keyboardType="number-pad"
              autoFocus={item.bodyweight}
              {...field}
              onChangeText={field.onChange}
              value={field.value}
              className="flex-1 py-2"
            />
          )}
        />
      </View>
      <ErrorText errors={[formState.errors.weight, formState.errors.reps]} />
      <Button size="xl" block onPress={handleSubmit(onSubmit)}>
        <Icon as={Check} className="size-7" strokeWidth={3} />
        Записать подход
      </Button>
    </View>
  );
};

type TimeEntryFormProps = {
  item: WorkoutItem;
  elapsed: number | undefined;
  onSubmit: (values: WorkoutSetValues) => void;
};

const TimeEntryForm = ({ item, elapsed, onSubmit }: TimeEntryFormProps) => {
  const { control, handleSubmit, formState } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(item.measure)),
    defaultValues: { time: elapsed ? timeInput(item.measure, elapsed) : '' },
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="time"
        render={({ field }) => (
          <BoxInput large
            label={`время, ${timeLabel(item.measure)}`}
            keyboardType={item.measure === 'TIME' ? 'default' : 'number-pad'}
            placeholder={timeInput(item.measure, item.repsMax)}
            autoFocus={!elapsed}
            {...field}
            onChangeText={field.onChange}
            value={field.value}
            className="py-2"
          />
        )}
      />
      <ErrorText errors={formState.errors.time} />
      <Button size="xl" block onPress={handleSubmit(onSubmit)}>
        <Icon as={Check} className="size-7" strokeWidth={3} />
        Записать подход
      </Button>
    </View>
  );
};

type SetEntrySheetProps = {
  open: boolean;
  item: WorkoutItem;
  timing: () => SetTiming;
  onClose: () => void;
  onSubmitStart: () => void;
  onSaved: () => void;
};

// Ввод подхода после «Закончил подход»: два крупных поля и одна кнопка.
// Отправка не держит экран: подход встаёт в офлайн-очередь, шторка закрывается сразу,
// подход виден в списке с меткой «ждёт отправки», пока сервер его не принял
export const SetEntrySheet = ({ open, item, timing, onClose, onSubmitStart, onSaved }: SetEntrySheetProps) => {
  const add = useAddSet();
  const hint = lastSetHint(item.last, item.sets.length + 1);
  const number = item.sets.length + 1;
  const timed = isTimed(item.measure);

  const submit = (values: WorkoutSetValues) => {
    const time = timing();
    onSubmitStart();
    Keyboard.dismiss();
    onSaved();
    add.mutate({ itemId: item.id, ...values, ...time, clientId: newClientId() });
  };

  const result = timed
    ? hint
      ? `Прошлый раз ${durationText(hint.reps)}`
      : 'Сколько по времени'
    : hint
      ? `Прошлый раз ${weightText(hint.weight)} × ${hint.reps}`
      : 'Сколько поднял и сколько раз';
  // Отдых прошлого раза рядом с весом: видно, сколько тогда сидел перед этим подходом
  const description =
    hint?.restBeforeSeconds != null ? `${result} · отдых ${restText(hint.restBeforeSeconds)}` : result;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={setCaption(number, item.plannedSets)} description={description}>
      {open &&
        (timed ? (
          <TimeEntryForm key={number} item={item} elapsed={timing().workSeconds ?? undefined} onSubmit={submit} />
        ) : (
          <SetEntryForm key={number} item={item} onSubmit={submit} />
        ))}
    </Sheet>
  );
};
