import { Keyboard, View } from 'react-native';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Undo2 } from 'lucide-react-native';

import {
  newClientId,
  type RoundEntryInput,
  roundEntrySchema,
  type RoundEntryValues,
  roundPrefill,
  type SetTiming,
  type SupersetRound,
  supersetLabels,
  useAddSet,
} from '@sportbot/api/entities/workout';
import { timeInput, timeLabel } from '@sportbot/api/lib/measure';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { TextField } from '@/shared/ui/kit/TextField';
import { Poster, Text } from '@/shared/ui/kit/Typography';

type RoundEntryFormProps = {
  round: SupersetRound;
  onSubmit: (values: RoundEntryValues) => void;
};

const RoundEntryForm = ({ round, onSubmit }: RoundEntryFormProps) => {
  const labels = supersetLabels(round.members);
  const label = (itemId: number) => labels[round.members.findIndex((e) => e.id === itemId)];
  const { control, handleSubmit, setValue, formState } = useForm<RoundEntryInput, unknown, RoundEntryValues>({
    resolver: zodResolver(roundEntrySchema),
    defaultValues: {
      rows: round.round.map((e) => ({
        itemId: e.id,
        bodyweight: e.bodyweight,
        measure: e.measure,
        skip: false,
        ...roundPrefill(e),
      })),
    },
  });
  const { fields } = useFieldArray({ control, name: 'rows' });
  const rows = useWatch({ control, name: 'rows' });
  const blocked =
    rows.every((r) => r.skip) || rows.some((r) => !r.skip && r.measure === 'REPS' && !r.bodyweight && !r.weight.trim());

  return (
    <View className="gap-3">
      <View className="border-border max-h-[50vh] border-t-[1.5px]">
        {fields.map((field, i) => {
          const item = round.round.find((e) => e.id === field.itemId)!;
          const row = rows[i]!;
          const rowErrors = formState.errors.rows?.[i];
          return (
            <View key={field.id} className="border-border gap-2 border-b-[1.5px] py-3">
              <View className="flex-row items-center gap-2">
                <Poster size="xs" tone="primary">
                  {label(item.id)}
                </Poster>
                <Text size="sm" className={cn('min-w-0 flex-1', row.skip && 'text-muted-foreground line-through')} numberOfLines={1}>
                  {item.name}
                </Text>
                <Button
                  variant={row.skip ? 'default' : 'outline'}
                  size="xs"
                  onPress={() => setValue(`rows.${i}.skip`, !row.skip, { shouldValidate: false })}
                >
                  {row.skip ? <Icon as={Undo2} className="size-3.5" /> : null}
                  {row.skip ? 'делал' : 'не делал'}
                </Button>
              </View>
              {!row.skip && (
                <View className={cn('gap-2', item.bodyweight || row.measure !== 'REPS' ? 'flex-col' : 'flex-row')}>
                  {!item.bodyweight && row.measure === 'REPS' && (
                    <Controller
                      control={control}
                      name={`rows.${i}.weight`}
                      render={({ field }) => (
                        <TextField
                          label="вес, кг"
                          placeholder="?"
                          keyboardType="decimal-pad"
                          error={rowErrors?.weight}
                          {...field}
                          onChangeText={field.onChange}
                          value={field.value}
                          className="flex-1"
                        />
                      )}
                    />
                  )}
                  <Controller
                    control={control}
                    name={`rows.${i}.reps`}
                    render={({ field }) => (
                      <TextField
                        label={row.measure === 'REPS' ? 'повторы' : `время, ${timeLabel(row.measure)}`}
                        keyboardType={row.measure === 'TIME' ? 'default' : 'number-pad'}
                        placeholder={row.measure === 'REPS' ? String(item.repsMin) : timeInput(row.measure, item.repsMin)}
                        error={rowErrors?.reps}
                        {...field}
                        onChangeText={field.onChange}
                        value={field.value}
                        className="flex-1"
                      />
                    )}
                  />
                </View>
              )}
              <ErrorText errors={[rowErrors?.weight, rowErrors?.reps]} />
            </View>
          );
        })}
      </View>
      <ErrorText errors={[formState.errors.rows?.root ?? formState.errors.rows]} />
      <Button size="xl" block disabled={blocked} onPress={handleSubmit(onSubmit)}>
        <Icon as={Check} className="size-7" strokeWidth={3} />
        Записать круг
      </Button>
    </View>
  );
};

type RoundEntrySheetProps = {
  open: boolean;
  round: SupersetRound | null;
  timing: () => SetTiming;
  onClose: () => void;
  onSaved: (addedIds: number[]) => void;
};

export const RoundEntrySheet = ({ open, round, timing, onClose, onSaved }: RoundEntrySheetProps) => {
  const add = useAddSet();

  const submit = ({ rows }: RoundEntryValues) => {
    Keyboard.dismiss();
    const done = rows.filter((r) => !r.skip);
    const time = timing();
    onSaved(done.map((r) => r.itemId));
    done.forEach((r, i) =>
      add.mutate({
        itemId: r.itemId,
        weight: r.weight,
        reps: r.reps,
        ...(i === 0 ? time : { doneAt: time.doneAt }),
        clientId: newClientId(),
      }),
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={`Круг ${round?.number} · суперсет ${round?.letter}`}
      description="Проверь вес и повторы — подставлены с прошлого раза"
    >
      {open && round && <RoundEntryForm key={`${round.superset}-${round.number}`} round={round} onSubmit={submit} />}
    </Sheet>
  );
};
