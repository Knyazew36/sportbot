import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import {
  type Profile,
  scheduleSchema,
  type ScheduleValues,
  timezoneSchema,
  type TimezoneValues,
  useCities,
  useSetTimezone,
  useUpdateProfile,
} from '@sportbot/api/entities/profile';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { DateTimeField } from '@/shared/ui/kit/DateTimeField';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { SettingRow } from '@/shared/ui/kit/SettingRow';
import { SheetSelectField } from '@/shared/ui/kit/SheetSelectField';
import { Switch } from '@/shared/ui/kit/Switch';
import { Text } from '@/shared/ui/kit/Typography';
import { WeekdayPicker } from '@/shared/ui/kit/WeekdayPicker';

const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней'];

const ScheduleForm = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    values: {
      trainingDays: profile.trainingDays,
      morningTime: profile.morningTime,
      eveningTime: profile.eveningTime,
    },
  });

  const save = handleSubmit((values) => update.mutateAsync(values).catch((error) => applyFieldErrors(error, setError)));

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="trainingDays"
        render={({ field }) => <WeekdayPicker value={field.value} onValueChange={field.onChange} />}
      />
      <ErrorText errors={errors.trainingDays} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="morningTime"
            render={({ field }) => (
              <DateTimeField
                mode="time"
                label="Утренний вопрос"
                value={field.value}
                onChange={field.onChange}
                error={errors.morningTime}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="eveningTime"
            render={({ field }) => (
              <DateTimeField
                mode="time"
                label="Вечерний вопрос"
                value={field.value}
                onChange={field.onChange}
                error={errors.eveningTime}
              />
            )}
          />
        </View>
      </View>
      {isDirty && (
        <Button block loading={update.isPending} onPress={() => void save()}>
          Сохранить расписание
        </Button>
      )}
    </View>
  );
};

const TimezoneForm = ({ profile }: { profile: Profile }) => {
  const cities = useCities();
  const setTimezone = useSetTimezone();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: { mode: 'city', zone: profile.timeZone },
  });
  const mode = useWatch({ control, name: 'mode' });

  const save = handleSubmit((values) =>
    setTimezone
      .mutateAsync(values.mode === 'city' ? { zone: values.zone } : { localTime: values.localTime })
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <View className="gap-2">
      <Text size="sm" tone="soft">
        Часовой пояс
      </Text>
      <Text size="xs" tone="muted">
        Сейчас: {profile.timeZoneTitle}
      </Text>
      <Controller
        control={control}
        name="mode"
        render={({ field }) => (
          <Segmented
            options={[
              { value: 'city', label: 'Город' },
              { value: 'time', label: 'Который час' },
            ]}
            value={field.value}
            onValueChange={field.onChange}
            stretch
          />
        )}
      />
      {mode === 'city' ? (
        <Controller
          control={control}
          name="zone"
          render={({ field }) => (
            <SheetSelectField
              options={(cities.data ?? []).map((c) => ({ value: c.zone, label: c.title }))}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              title="Город"
            />
          )}
        />
      ) : (
        <Controller
          control={control}
          name="localTime"
          render={({ field }) => (
            <DateTimeField
              mode="time"
              label="Сколько сейчас на твоих часах"
              value={field.value ?? ''}
              onChange={field.onChange}
              error={'localTime' in errors ? errors.localTime : undefined}
            />
          )}
        />
      )}
      <Button variant="outline" block loading={setTimezone.isPending} onPress={() => void save()}>
        Сохранить пояс
      </Button>
    </View>
  );
};

// Переключатели сохраняются сразу, как таймеры в «Тренировке» — без кнопки формы
const QuestionsRows = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  return (
    <View>
      <SettingRow
        title="Вопросы бота"
        hint={
          profile.questionsEnabled
            ? 'Утром спросит, будешь ли тренироваться, вечером — как прошло'
            : 'Выключены: бот сам не пишет. Тренировочный день без отметки здесь — пропуск'
        }
        className="border-t-[1.5px]"
      >
        <Switch
          accessibilityLabel="Вопросы бота"
          value={profile.questionsEnabled}
          disabled={update.isPending}
          onValueChange={(questionsEnabled) => update.mutate({ questionsEnabled })}
        />
      </SettingRow>
      {/* Повторять нечего, пока сами вопросы выключены */}
      {profile.questionsEnabled && (
        <SettingRow
          title="Напоминать"
          hint={
            profile.remindersEnabled
              ? 'Нет ответа — утренний вопрос повторю через 2 часа, вечерний наутро'
              : 'Каждый вопрос приходит один раз'
          }
        >
          <Switch
            accessibilityLabel="Напоминать"
            value={profile.remindersEnabled}
            disabled={update.isPending}
            onValueChange={(remindersEnabled) => update.mutate({ remindersEnabled })}
          />
        </SettingRow>
      )}
    </View>
  );
};

// Расписание — порт pages/me-section/components/ScheduleSection.tsx: дни, время вопросов, напоминания, часовой пояс
export const ScheduleSection = ({ profile }: { profile: Profile }) => (
  <ScreenSection aside={`${pluralize(profile.trainingDays.length, DAY_FORMS)} в неделю`} className="gap-5">
    <ScheduleForm profile={profile} />
    <QuestionsRows profile={profile} />
    <TimezoneForm profile={profile} />
  </ScreenSection>
);
