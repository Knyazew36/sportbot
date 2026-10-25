import type { ReactNode } from 'react';
import { Switch, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { type StretchFormInput, useMuscles } from '@sportbot/api/entities/catalog';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Grid } from '@/shared/ui/kit/Grid';
import { Input } from '@/shared/ui/kit/Input';
import { SettingRow } from '@/shared/ui/kit/SettingRow';
import { TextField } from '@/shared/ui/kit/TextField';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

import { TextListField } from './TextListField';

const Section = ({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) => (
  <View className="gap-3">
    <View className="flex-row items-end justify-between gap-3">
      <Eyebrow tone="primary">{title}</Eyebrow>
      {aside ? <Eyebrow>{aside}</Eyebrow> : null}
    </View>
    {children}
  </View>
);

type StretchFieldsProps = {
  /** Под названием: при создании — «Возможно, ты искал…». Получает введённое название */
  afterName?: (name: string) => ReactNode;
};

// Поля растяжки (business-tz, 5.3) — порт widgets/catalog/StretchFields.tsx: общие для создания и правки.
// Форма и её схема — снаружи, поля берут её из FormProvider.
// Картинки нет, как в ExerciseFields: выбор фото с устройства — отдельная задача (expo-image-picker).
// Тип «заминка / разминка» и фото финиша — поля админа, админку в мобилку не переносим
export const StretchFields = ({ afterName }: StretchFieldsProps) => {
  const muscles = useMuscles();
  const { colors } = useTheme();
  const {
    control,
    formState: { errors },
  } = useFormContext<StretchFormInput>();
  const name = useWatch({ control, name: 'name' });

  return (
    <View className="gap-6">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Название"
            error={errors.name}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {afterName?.(name)}

      <Section title="Какие мышцы тянет" aside="хотя бы одна">
        <Text size="sm" tone="muted">
          По ним бот подбирает растяжку в заминку после тренировки.
        </Text>
        <Controller
          control={control}
          name="muscles"
          render={({ field }) => (
            <Grid items={muscles.data ?? []} columns={2} keyOf={(m) => m.id}>
              {(m) => {
                const on = field.value.includes(m.id);
                return (
                  <Button
                    variant={on ? 'default' : 'outline'}
                    size="sm"
                    block
                    contentClassName="min-h-11 justify-start px-3"
                    onPress={() => field.onChange(on ? field.value.filter((id) => id !== m.id) : [...field.value, m.id])}
                  >
                    {m.name}
                  </Button>
                );
              }}
            </Grid>
          )}
        />
        <ErrorText errors={errors.muscles} />
      </Section>

      <Section title="Удержание">
        <Controller
          control={control}
          name="holdSeconds"
          render={({ field }) => (
            <TextField
              label="Время, секунд"
              keyboardType="number-pad"
              description="От 5 до 300 секунд."
              error={errors.holdSeconds}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <SettingRow title="На каждую сторону" hint="Время удваивается" className="border-t-[1.5px]">
          <Controller
            control={control}
            name="perSide"
            render={({ field }) => (
              <Switch
                accessibilityLabel="На каждую сторону"
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ true: colors.blue, false: colors.hatch }}
                thumbColor={colors.paper}
              />
            )}
          />
        </SettingRow>
      </Section>

      <Section title="Как делать">
        <Controller
          control={control}
          name="howTo"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text size="sm" tone="soft">
                Описание
              </Text>
              <Input
                multiline
                textAlignVertical="top"
                placeholder="Исходное положение и что должно тянуть"
                accessibilityLabel="Как делать"
                invalid={!!errors.howTo}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                className="h-auto min-h-24 py-3"
              />
              <ErrorText errors={errors.howTo} />
            </View>
          )}
        />
        <TextListField name="steps" label="Шаги" placeholder="Одно действие" addLabel="Добавить шаг" />
        <TextListField name="mistakes" label="Ошибки" placeholder="Ошибка — как исправить" addLabel="Добавить ошибку" />
      </Section>
    </View>
  );
};
