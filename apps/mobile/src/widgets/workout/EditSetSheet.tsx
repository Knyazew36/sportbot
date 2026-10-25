import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react-native';

import {
  type TimeSetInput,
  timeSetSchema,
  useDeleteSet,
  useUpdateSet,
  type WorkoutSet,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@sportbot/api/entities/workout';
import { isTimed, type Measure, timeInput, timeLabel } from '@sportbot/api/lib/measure';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { TextField } from '@/shared/ui/kit/TextField';

export type EditingSet = { set: WorkoutSet; measure: Measure };

type RepsFieldsProps = {
  set: WorkoutSet;
  onSave: (values: WorkoutSetValues) => void;
};

const RepsFields = ({ set, onSave }: RepsFieldsProps) => {
  const { control, handleSubmit, formState } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: set.weight ? String(set.weight) : '', reps: String(set.reps) },
  });

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <TextField
              label="вес, кг"
              placeholder="свой"
              keyboardType="decimal-pad"
              error={formState.errors.weight}
              {...field}
              onChangeText={field.onChange}
              value={field.value}
              className="flex-1"
            />
          )}
        />
        <Controller
          control={control}
          name="reps"
          render={({ field }) => (
            <TextField
              label="повторы"
              keyboardType="number-pad"
              error={formState.errors.reps}
              {...field}
              onChangeText={field.onChange}
              value={field.value}
              className="flex-1"
            />
          )}
        />
      </View>
      <ErrorText errors={[formState.errors.weight, formState.errors.reps]} />
      <Button size="lg" block onPress={handleSubmit(onSave)}>
        Сохранить
      </Button>
    </View>
  );
};

type TimeFieldsProps = {
  set: WorkoutSet;
  measure: Measure;
  onSave: (values: WorkoutSetValues) => void;
};

const TimeFields = ({ set, measure, onSave }: TimeFieldsProps) => {
  const { control, handleSubmit, formState } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(measure)),
    defaultValues: { time: timeInput(measure, set.reps) },
  });

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="time"
        render={({ field }) => (
          <TextField
            label={`время, ${timeLabel(measure)}`}
            keyboardType={measure === 'TIME' ? 'default' : 'number-pad'}
            error={formState.errors.time}
            {...field}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      <ErrorText errors={formState.errors.time} />
      <Button size="lg" block onPress={handleSubmit(onSave)}>
        Сохранить
      </Button>
    </View>
  );
};

type EditSetFormProps = {
  editing: EditingSet;
  onClose: () => void;
};

const EditSetForm = ({ editing: { set, measure }, onClose }: EditSetFormProps) => {
  const update = useUpdateSet();
  const remove = useDeleteSet();
  const ref = { id: set.id, clientId: set.clientId };

  const save = (values: WorkoutSetValues) => {
    update.mutate({ ...ref, ...values });
    onClose();
  };

  return (
    <View className="gap-3">
      {isTimed(measure) ? <TimeFields set={set} measure={measure} onSave={save} /> : <RepsFields set={set} onSave={save} />}
      <ConfirmAction
        trigger={<Button variant="destructive" block />}
        title={`Удалить подход ${set.number}?`}
        confirmLabel="Удалить"
        onConfirm={() => {
          remove.mutate(ref);
          onClose();
        }}
      >
        <Icon as={Trash2} className="size-4" />
        Удалить подход
      </ConfirmAction>
    </View>
  );
};

type EditSetSheetProps = {
  editing: EditingSet | null;
  onClose: () => void;
};

export const EditSetSheet = ({ editing, onClose }: EditSetSheetProps) => (
  <Sheet
    open={editing != null}
    onOpenChange={(open) => !open && onClose()}
    title={`Подход ${editing?.set.number}`}
    description={
      editing && isTimed(editing.measure) ? 'Исправь время подхода.' : 'Исправь вес или повторы. Пустой вес — свой вес.'
    }
  >
    {editing && <EditSetForm key={editing.set.clientId ?? editing.set.id} editing={editing} onClose={onClose} />}
  </Sheet>
);
