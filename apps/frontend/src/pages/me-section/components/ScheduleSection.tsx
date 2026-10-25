import { pluralize } from '@front-cmdt/utils/pluralize'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
  type Profile,
  scheduleSchema,
  type ScheduleValues,
  timezoneSchema,
  type TimezoneValues,
  useCities,
  useSetTimezone,
  useUpdateProfile,
} from '@sportbot/api/entities/profile'
import { applyFieldErrors } from '@/shared/lib/form'
import { WEEKDAYS } from '@/shared/lib/weekdays'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { SheetSelectField } from '@/shared/ui/kit/SheetSelectField'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней']

const ScheduleForm = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile()
  const {
    control,
    register,
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
  })

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={handleSubmit(values => update.mutateAsync(values).catch(error => applyFieldErrors(error, setError)))}
    >
      <Controller
        control={control}
        name='trainingDays'
        render={({ field }) => (
          <ToggleGroup
            multiple
            value={field.value.map(String)}
            onValueChange={v => field.onChange(v.map(Number))}
            className='grid w-full grid-cols-7'
            aria-label='Тренировочные дни'
          >
            {WEEKDAYS.map(d => (
              <ToggleGroupItem
                key={d.value}
                value={String(d.value)}
                className='h-11 px-0'
              >
                {d.short}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
      <ErrorText errors={errors.trainingDays} />
      <div className='grid grid-cols-2 gap-3'>
        <TextField
          label='Утренний вопрос'
          type='time'
          error={errors.morningTime}
          {...register('morningTime')}
        />
        <TextField
          label='Вечерний вопрос'
          type='time'
          error={errors.eveningTime}
          {...register('eveningTime')}
        />
      </div>
      {isDirty && (
        <Button
          type='submit'
          className='w-full'
          disabled={update.isPending}
        >
          Сохранить расписание
        </Button>
      )}
    </form>
  )
}

const TimezoneForm = ({ profile }: { profile: Profile }) => {
  const cities = useCities()
  const setTimezone = useSetTimezone()
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: { mode: 'city', zone: profile.timeZone },
  })
  const mode = useWatch({ control, name: 'mode' })

  return (
    <form
      className='flex flex-col gap-2'
      onSubmit={handleSubmit(values =>
        setTimezone
          .mutateAsync(values.mode === 'city' ? { zone: values.zone } : { localTime: values.localTime })
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <Label>Часовой пояс</Label>
      <Text
        size='xs'
        tone='muted'
      >
        Сейчас: {profile.timeZoneTitle}
      </Text>
      <Controller
        control={control}
        name='mode'
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
          name='zone'
          render={({ field }) => (
            <SheetSelectField
              options={(cities.data ?? []).map(c => ({ value: c.zone, label: c.title }))}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              title='Город'
            />
          )}
        />
      ) : (
        <TextField
          label='Сколько сейчас на твоих часах'
          type='time'
          error={'localTime' in errors ? errors.localTime : undefined}
          {...register('localTime')}
        />
      )}
      <Button
        type='submit'
        variant='outline'
        className='w-full'
        disabled={setTimezone.isPending}
      >
        Сохранить пояс
      </Button>
    </form>
  )
}

// Переключатели сохраняются сразу, как таймеры в «Тренировке» — без кнопки формы
const QuestionsRows = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile()
  return (
    <div>
      <SettingRow
        title='Вопросы бота'
        hint={
          profile.questionsEnabled
            ? 'Утром спросит, будешь ли тренироваться, вечером — как прошло'
            : 'Выключены: бот сам не пишет. Тренировочный день без отметки здесь — пропуск'
        }
        htmlFor='questions'
        className='border-t-[1.5px]'
      >
        <Switch
          id='questions'
          checked={profile.questionsEnabled}
          disabled={update.isPending}
          onCheckedChange={questionsEnabled => update.mutate({ questionsEnabled })}
        />
      </SettingRow>
      {/* Повторять нечего, пока сами вопросы выключены */}
      {profile.questionsEnabled && <RemindersRow profile={profile} />}
    </div>
  )
}

const RemindersRow = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile()
  return (
    <SettingRow
      title='Напоминать'
      hint={
        profile.remindersEnabled
          ? 'Нет ответа — утренний вопрос повторю через 2 часа, вечерний наутро'
          : 'Каждый вопрос приходит один раз'
      }
      htmlFor='reminders'
    >
      <Switch
        id='reminders'
        checked={profile.remindersEnabled}
        disabled={update.isPending}
        onCheckedChange={remindersEnabled => update.mutate({ remindersEnabled })}
      />
    </SettingRow>
  )
}

// Расписание (frontend-tz, 13.1): дни, время вопросов, напоминания, часовой пояс как в боте
export const ScheduleSection = ({ profile }: { profile: Profile }) => (
  <ScreenSection aside={`${pluralize(profile.trainingDays.length, DAY_FORMS)} в неделю`}>
    <ScheduleForm profile={profile} />
    <QuestionsRows profile={profile} />
    <TimezoneForm profile={profile} />
  </ScreenSection>
)
