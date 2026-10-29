import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { complexLetter, type Program } from '@sportbot/api/entities/program';
import { type ManualWorkoutInput, manualWorkoutSchema, type ManualWorkoutValues } from '@sportbot/api/entities/workout';

import { usePrograms, useProgram } from '@/shared/local/entities/program';
import { useCreateManualWorkout } from '@/shared/local/entities/workout';

import { ROUTES, routeHref } from '@/shared/config/routes';
import { applyFieldErrors } from '@/shared/lib/form';
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { DateTimeField } from '@/shared/ui/kit/DateTimeField';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

type ManualWorkoutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ManualWorkoutFormProps = {
  program: Program | null;
  onClose: () => void;
};

const ManualWorkoutForm = ({ program, onClose }: ManualWorkoutFormProps) => {
  const create = useCreateManualWorkout();
  const today = format(new Date(), 'yyyy-MM-dd');
  // Пустой комплекс не засчитать: в тренировке не было бы упражнений для подходов
  const complexes = (program?.complexes ?? []).filter((c) => c.exercises.length);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ManualWorkoutInput, unknown, ManualWorkoutValues>({
    resolver: zodResolver(manualWorkoutSchema(today)),
    defaultValues: { date: today, complexId: complexes.find((c) => c.isNext)?.id ?? complexes[0]?.id },
  });

  const save = handleSubmit((values) =>
    create
      .mutateAsync(values)
      .then((workoutId) => {
        onClose();
        // Подходы вписываются на экране исправления; «Назад» оттуда ведёт в посещения на месяц тренировки
        router.push(routeHref(ROUTES.WORKOUT_EDIT, { workoutId, month: values.date.slice(0, 7) }));
      })
      .catch((error) => applyFieldErrors(error, setError)),
  );

  if (!complexes.length)
    return (
      <View className="gap-3">
        <Text tone="soft">
          {program
            ? 'В активной программе нет тренировок с упражнениями — добавь их, чтобы было что отметить.'
            : 'Нет активной программы — выбери или собери её, чтобы было из чего выбрать тренировку.'}
        </Text>
        <ButtonLink href={ROUTES.PROGRAMS} block onNavigate={onClose}>
          К программам
        </ButtonLink>
      </View>
    );

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DateTimeField
            mode="date"
            value={field.value}
            onChange={field.onChange}
            label="День"
            error={errors.date}
            maximumDate={new Date()}
          />
        )}
      />
      <View className="gap-1.5">
        <Text size="sm" tone="soft">
          Тренировка
        </Text>
        <Controller
          control={control}
          name="complexId"
          render={({ field }) => (
            <View className="gap-2">
              {complexes.map((c) => (
                <OptionButton
                  key={c.id}
                  mark={complexLetter(program!.complexes.indexOf(c))}
                  title={c.name}
                  meta={pluralize(c.exercises.length, EXERCISE_FORMS)}
                  selected={c.id === field.value}
                  onPress={() => field.onChange(c.id)}
                />
              ))}
            </View>
          )}
        />
        <ErrorText errors={errors.complexId} />
      </View>
      <Button block loading={create.isPending} onPress={() => void save()}>
        Добавить
      </Button>
    </View>
  );
};

// Тренировка, которую забыли отметить, — порт pages/stats/components/ManualWorkoutSheet.tsx:
// день и комплекс, подходы — потом на экране исправления
export const ManualWorkoutSheet = ({ open, onOpenChange }: ManualWorkoutSheetProps) => {
  const programs = usePrograms();
  const activeId = programs.data?.find((p) => p.active)?.id;
  const program = useProgram(activeId);
  const close = () => onOpenChange(false);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить тренировку"
      description="Засчитается в посещения и серию. Подходы впишешь на следующем шаге — или оставишь пустой."
    >
      {open && (
        <QueryState query={programs}>
          {() =>
            // Нет активной программы — запрос её состава выключен, форма покажет подсказку
            activeId == null ? (
              <ManualWorkoutForm program={null} onClose={close} />
            ) : (
              <QueryState query={program}>{(p) => <ManualWorkoutForm program={p} onClose={close} />}</QueryState>
            )
          }
        </QueryState>
      )}
    </Sheet>
  );
};
