import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { type Equipment, EQUIPMENT_LABEL, type ExerciseCreateInput } from '@sportbot/api/entities/catalog';
import { useJoints, useMuscles } from '@/shared/local/entities/catalog';
import { type Measure, MEASURE_LABEL } from '@sportbot/api/lib/measure';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Grid } from '@/shared/ui/kit/Grid';
import { Input } from '@/shared/ui/kit/Input';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { TextField } from '@/shared/ui/kit/TextField';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

import { MuscleRoles } from './MuscleRoles';
import { TextListField } from './TextListField';

const EQUIPMENT = (Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((value) => ({ value, label: EQUIPMENT_LABEL[value] }));
const MEASURES = (Object.keys(MEASURE_LABEL) as Measure[]).map((value) => ({ value, label: MEASURE_LABEL[value] }));

const Section = ({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) => (
  <View className="gap-3">
    <View className="flex-row items-end justify-between gap-3">
      <Eyebrow tone="primary">{title}</Eyebrow>
      {aside ? <Eyebrow>{aside}</Eyebrow> : null}
    </View>
    {children}
  </View>
);

type ExerciseFieldsProps = {
  /** Под названием: при создании — «Возможно, ты искал…». Получает введённое название */
  afterName?: (name: string) => ReactNode;
};

// Поля нового упражнения (business-tz, 5.2) — порт widgets/catalog/ExerciseFields.tsx.
// Форма и её схема — снаружи, поля берут её из FormProvider.
// Картинки здесь пока нет: выбор фото с устройства — отдельная задача (expo-image-picker), поле необязательное
export const ExerciseFields = ({ afterName }: ExerciseFieldsProps) => {
  const muscles = useMuscles();
  const joints = useJoints();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ExerciseCreateInput>();
  const [primary, secondary, name] = useWatch({ control, name: ['primary', 'secondary', 'name'] });

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

      <Section title="Инвентарь">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-gutter" contentContainerClassName="px-gutter">
          <Controller
            control={control}
            name="equipment"
            render={({ field }) => (
              <Segmented
                options={EQUIPMENT}
                // У записи инвентаря может не быть: повторный тап снимает выбор
                value={field.value ?? ('' as Equipment)}
                onValueChange={(v) => field.onChange(v === field.value ? null : v)}
              />
            )}
          />
        </ScrollView>
      </Section>

      <Section title="Чем меряется">
        <Text size="sm" tone="muted">
          Секунды — для удержаний вроде планки, минуты — для кардио: дорожка, велотренажёр, скакалка. Без веса.
        </Text>
        <Controller
          control={control}
          name="measure"
          render={({ field }) => <Segmented options={MEASURES} value={field.value} onValueChange={field.onChange} stretch />}
        />
      </Section>

      <Section title="Мышцы" aside="нажимай по кругу">
        <Text size="sm" tone="muted">
          1 нажатие — основная (делает главную работу), 2 — помогает, 3 — не участвует.
        </Text>
        <MuscleRoles
          muscles={muscles.data ?? []}
          primary={primary}
          secondary={secondary}
          onChange={(next) => {
            setValue('primary', next.primary, { shouldDirty: true, shouldValidate: true });
            setValue('secondary', next.secondary, { shouldDirty: true });
          }}
        />
        <ErrorText errors={errors.primary} />
      </Section>

      <Section title="Суставы под нагрузкой" aside="можно пропустить">
        <Text size="sm" tone="muted">
          У кого в профиле ограничение на отмеченный сустав, тот увидит предупреждение на этом упражнении.
        </Text>
        <Controller
          control={control}
          name="jointIds"
          render={({ field }) => (
            <Grid items={joints.data ?? []} columns={2} keyOf={(j) => j.id}>
              {(j) => {
                const on = field.value.includes(j.id);
                return (
                  <Button
                    variant={on ? 'default' : 'outline'}
                    size="sm"
                    block
                    contentClassName="min-h-11 justify-start px-3"
                    onPress={() => field.onChange(on ? field.value.filter((id) => id !== j.id) : [...field.value, j.id])}
                  >
                    {j.name}
                  </Button>
                );
              }}
            </Grid>
          )}
        />
      </Section>

      <Section title="Техника">
        <Controller
          control={control}
          name="technique"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text size="sm" tone="soft">
                Описание
              </Text>
              <Input
                multiline
                textAlignVertical="top"
                placeholder="Исходное положение и на что обратить внимание"
                accessibilityLabel="Описание техники"
                invalid={!!errors.technique}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                className="h-auto min-h-24 py-3"
              />
              <ErrorText errors={errors.technique} />
            </View>
          )}
        />
        <TextListField name="steps" label="Шаги" placeholder="Одно действие" addLabel="Добавить шаг" />
        <TextListField name="mistakes" label="Ошибки" placeholder="Ошибка — как исправить" addLabel="Добавить ошибку" />
        <Controller
          control={control}
          name="videoUrl"
          render={({ field }) => (
            <TextField
              label="Ссылка на видео"
              placeholder="https://"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.videoUrl}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </Section>
    </View>
  );
};
