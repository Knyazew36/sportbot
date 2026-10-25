import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react-native';

import {
  newClientId,
  type TimeSetInput,
  timeSetSchema,
  useAddSet,
  type WorkoutItem,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@sportbot/api/entities/workout';
import { isTimed, timeLabel } from '@sportbot/api/lib/measure';
import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Icon } from '@/shared/ui/kit/Icon';
import { TextField } from '@/shared/ui/kit/TextField';

const AddButton = ({ item, pending, onPress }: { item: WorkoutItem; pending: boolean; onPress: () => void }) => (
  <Button
    size="icon-lg"
    className="self-end"
    loading={pending}
    accessibilityLabel={`Добавить подход в «${item.name}»`}
    onPress={onPress}
  >
    <Icon as={Plus} className="size-6" />
  </Button>
);

// Подход на время: одно поле — секунды или мм:сс
const TimeAddForm = ({ item }: { item: WorkoutItem }) => {
  const add = useAddSet();
  const { control, handleSubmit, reset, setError, formState } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(item.measure)),
    defaultValues: { time: '' },
  });

  const submit = handleSubmit((values) =>
    add
      .mutateAsync({ itemId: item.id, ...values, clientId: newClientId() })
      .then(() => reset({ time: '' }))
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <View className="mt-3 gap-2">
      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <View className="flex-1">
              <TextField
                label={`время, ${timeLabel(item.measure)}`}
                keyboardType={item.measure === 'TIME' ? 'numbers-and-punctuation' : 'number-pad'}
                invalid={!!formState.errors.time}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            </View>
          )}
        />
        <AddButton item={item} pending={add.isPending} onPress={() => void submit()} />
      </View>
      <ErrorText errors={formState.errors.time} />
    </View>
  );
};

const RepsAddForm = ({ item }: { item: WorkoutItem }) => {
  const add = useAddSet();
  const { control, handleSubmit, reset, setError, formState } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: '', reps: '' },
  });

  const submit = handleSubmit((values) =>
    add
      .mutateAsync({ itemId: item.id, ...values, clientId: newClientId() })
      .then(() => reset({ weight: '', reps: '' }))
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <View className="mt-3 gap-2">
      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <View className="flex-1">
              <TextField
                label="вес, кг"
                placeholder="свой"
                keyboardType="decimal-pad"
                invalid={!!formState.errors.weight}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            </View>
          )}
        />
        <Controller
          control={control}
          name="reps"
          render={({ field }) => (
            <View className="flex-1">
              <TextField
                label="повторы"
                keyboardType="number-pad"
                invalid={!!formState.errors.reps}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            </View>
          )}
        />
        <AddButton item={item} pending={add.isPending} onPress={() => void submit()} />
      </View>
      <ErrorText errors={[formState.errors.weight, formState.errors.reps]} />
    </View>
  );
};

// Дописать забытый подход в прошедшую тренировку: встаёт последним, упражнение засчитывается сделанным.
// Ошибку поля показываем одной строкой под рядом, а не под каждым узким полем
export const AddSetForm = ({ item }: { item: WorkoutItem }) =>
  isTimed(item.measure) ? <TimeAddForm item={item} /> : <RepsAddForm item={item} />;
