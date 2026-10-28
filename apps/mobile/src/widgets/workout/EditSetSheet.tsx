import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react-native';

import { type TimeSetInput, timeSetSchema, type WorkoutSet, type WorkoutSetInput, workoutSetSchema, type WorkoutSetValues } from '@sportbot/api/entities/workout';
import { useDeleteSet, useUpdateSet } from '@/shared/local/entities/workout';
import { isTimed, type Measure, timeInput, timeLabel } from '@sportbot/api/lib/measure';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { BoxInput } from '@/shared/ui/kit/BoxInput';

export type EditingSet = { set: WorkoutSet; measure: Measure };

type RepsFieldsProps = {
  set: WorkoutSet;
  onSave: (values: WorkoutSetValues) => void;
  actions: ReactNode;
};

const RepsFields = ({ set, onSave, actions }: RepsFieldsProps) => {
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
            <BoxInput large
              label="вес, кг"
              placeholder="свой"
              keyboardType="decimal-pad"
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
              keyboardType="number-pad"
              {...field}
              onChangeText={field.onChange}
              value={field.value}
              className="flex-1 py-2"
            />
          )}
        />
      </View>
      <ErrorText errors={[formState.errors.weight, formState.errors.reps]} />
      <View className="flex-row gap-2">
        <Button size="lg" className="flex-1" onPress={handleSubmit(onSave)}>
          Сохранить
        </Button>
        {actions}
      </View>
    </View>
  );
};

type TimeFieldsProps = {
  set: WorkoutSet;
  measure: Measure;
  onSave: (values: WorkoutSetValues) => void;
  actions: ReactNode;
};

const TimeFields = ({ set, measure, onSave, actions }: TimeFieldsProps) => {
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
          <BoxInput large
            label={`время, ${timeLabel(measure)}`}
            keyboardType={measure === 'TIME' ? 'default' : 'number-pad'}
            {...field}
            onChangeText={field.onChange}
            value={field.value}
            className="py-2"
          />
        )}
      />
      <ErrorText errors={formState.errors.time} />
      <View className="flex-row gap-2">
        <Button size="lg" className="flex-1" onPress={handleSubmit(onSave)}>
          Сохранить
        </Button>
        {actions}
      </View>
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

  // Удаление — только иконка в ряд с «Сохранить», подтверждение через ConfirmAction
  const deleteAction = (
    <ConfirmAction
      trigger={<Button variant="destructive" size="lg" accessibilityLabel="Удалить подход" />}
      title={`Удалить подход ${set.number}?`}
      confirmLabel="Удалить"
      onConfirm={() => {
        remove.mutate(ref);
        onClose();
      }}
    >
      <Icon as={Trash2} className="size-5" />
    </ConfirmAction>
  );

  return isTimed(measure) ? (
    <TimeFields set={set} measure={measure} onSave={save} actions={deleteAction} />
  ) : (
    <RepsFields set={set} onSave={save} actions={deleteAction} />
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
