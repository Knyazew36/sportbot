import { useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  type ComplexExerciseInput,
  complexExerciseMinutesSchema,
  complexExerciseSchema,
  complexExerciseTimeSchema,
  type ComplexExerciseValues,
  type ProgramExercise,
} from '@sportbot/api/entities/program';
import { isTimed, timeInput } from '@sportbot/api/lib/measure';

import { applyFieldErrors } from '@/shared/lib/form';
import { cn } from '@/shared/lib/utils';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Input } from '@/shared/ui/kit/Input';
import { Poster, Text } from '@/shared/ui/kit/Typography';

const CELL = 'font-display h-9 px-1 text-center text-[20px] leading-[22px]';

// Мелкая подпись под полем плана: без неё «3 × 8–12» читается не всеми
const Caption = ({ children }: { children: string }) => (
  <Text size="2xs" tone="muted" numberOfLines={1} className="text-center">
    {children}
  </Text>
);

type ExercisePlanFormProps = {
  exercise: ProgramExercise;
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>;
  /** Кнопки в конце ряда полей: посмотреть, удалить */
  children?: ReactNode;
  className?: string;
};

type Field = keyof ComplexExerciseInput;

// План «3 × 8–12» правится на месте — порт widgets/program-editor/ExercisePlanForm.tsx. Сохраняется, когда фокус
// ушёл из всех полей плана. У удержания вместо повторов — секунды «30–60», у кардио — одно число минут «20»
export const ExercisePlanForm = ({ exercise, onPlanChange, children, className }: ExercisePlanFormProps) => {
  const { measure } = exercise;
  const timed = isTimed(measure);
  const single = measure === 'MINUTES';
  const reps = (value: number) => (timed ? timeInput(measure, value) : String(value));
  const schema =
    measure === 'MINUTES' ? complexExerciseMinutesSchema : measure === 'TIME' ? complexExerciseTimeSchema : complexExerciseSchema;
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComplexExerciseInput, unknown, ComplexExerciseValues>({
    resolver: zodResolver(schema),
    // values, а не defaultValues: после сохранения или правки в боте поля встают в новое значение
    values: {
      sets: String(exercise.sets),
      repsMin: reps(exercise.repsMin),
      repsMax: reps(exercise.repsMax),
    },
  });

  const save = handleSubmit((plan) => {
    const same = plan.sets === exercise.sets && plan.repsMin === exercise.repsMin && plan.repsMax === exercise.repsMax;
    if (same) return;
    return onPlanChange(plan).catch((error) => applyFieldErrors(error, setError));
  });

  // Переход между полями плана — ещё правка: blur одного и focus другого приходят подряд, ждём кадр
  const focused = useRef<Field | null>(null);
  const focus = (name: Field) => {
    focused.current = name;
  };
  const blur = (name: Field) => {
    if (focused.current === name) focused.current = null;
    setTimeout(() => {
      if (!focused.current) void save();
    }, 0);
  };

  const cell = (name: Field, label: string, width: string, keyboard: 'number-pad' | 'numbers-and-punctuation') => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          value={field.value}
          onChangeText={field.onChange}
          onFocus={() => focus(name)}
          onBlur={() => {
            field.onBlur();
            blur(name);
          }}
          onSubmitEditing={() => void save()}
          // Двоеточие для «мм:сс» есть только на клавиатуре со знаками; минуты и повторы — числа
          keyboardType={keyboard}
          selectTextOnFocus
          accessibilityLabel={label}
          invalid={!!errors[name]}
          className={cn(CELL, width)}
        />
      )}
    />
  );

  const timeKeyboard = measure === 'TIME' ? 'numbers-and-punctuation' : 'number-pad';

  return (
    <View className={className}>
      <View className="flex-row flex-wrap items-start gap-1.5">
        <View className="items-center gap-1">
          {cell('sets', 'Подходов', 'w-11', 'number-pad')}
          <Caption>подх.</Caption>
        </View>
        <Poster size="sm" className="leading-9">
          ×
        </Poster>
        <View className="items-center gap-1">
          <View className="flex-row items-center gap-1.5">
            {cell(
              'repsMin',
              single ? 'Минут' : timed ? 'Время от' : 'Повторов от',
              measure === 'TIME' ? 'w-16' : 'w-12',
              timeKeyboard,
            )}
            {!single && (
              <>
                <Poster size="sm">–</Poster>
                {cell('repsMax', timed ? 'Время до' : 'Повторов до', timed ? 'w-16' : 'w-12', timeKeyboard)}
              </>
            )}
          </View>
          <Caption>{single ? 'мин' : timed ? 'сек' : 'повт.'}</Caption>
        </View>
        {children}
      </View>
      <View className="mt-2">
        <ErrorText errors={[errors.sets, errors.repsMin, errors.repsMax]} />
      </View>
    </View>
  );
};
