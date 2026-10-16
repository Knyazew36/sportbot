import { type Profile, useUpdateProfile } from '@/entities/profile'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'

const REST = [
  { value: '60', label: '1:00' },
  { value: '90', label: '1:30' },
  { value: '120', label: '2:00' },
  { value: '180', label: '3:00' },
]

// Таймер отдыха (frontend-tz, 13.2). Переключатели сохраняются сразу — отдельной кнопки нет
export const TrainingSection = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile()
  const rest = String(profile.restSeconds)
  // Значение, выставленное в боте или старой версией, тоже должно быть видно
  const custom = `${Math.floor(profile.restSeconds / 60)}:${String(profile.restSeconds % 60).padStart(2, '0')}`
  const options = REST.some(r => r.value === rest) ? REST : [...REST, { value: rest, label: custom }]

  return (
    <ScreenSection>
      <SettingRow
        title='Таймер отдыха'
        hint={
          profile.showRestTimer
            ? 'Показывается после каждого подхода'
            : 'Скрыт: на экране тренировки только запись подходов'
        }
        htmlFor='rest-timer'
        className='border-t-[1.5px]'
      >
        <Switch
          id='rest-timer'
          checked={profile.showRestTimer}
          disabled={update.isPending}
          onCheckedChange={showRestTimer => update.mutate({ showRestTimer })}
        />
      </SettingRow>
      {/* Остальное про таймер имеет смысл, только пока он показывается */}
      {profile.showRestTimer && (
        <>
          <div className='flex flex-col gap-2'>
            <Label>Отдых между подходами</Label>
            <Segmented
              options={options}
              value={rest}
              onValueChange={v => update.mutate({ restSeconds: Number(v) })}
              size='default'
              stretch
            />
          </div>
          <div>
            <SettingRow
              title='Автостарт таймера'
              hint='Отдых пойдёт сам после записи подхода'
              htmlFor='autostart'
              className='border-t-[1.5px]'
            >
              <Switch
                id='autostart'
                checked={profile.restAutoStart}
                disabled={update.isPending}
                onCheckedChange={restAutoStart => update.mutate({ restAutoStart })}
              />
            </SettingRow>
            <SettingRow
              title='Звук'
              hint='Когда таймер закончился'
              htmlFor='sound'
            >
              <Switch
                id='sound'
                checked={profile.timerSound}
                disabled={update.isPending}
                onCheckedChange={timerSound => update.mutate({ timerSound })}
              />
            </SettingRow>
            <SettingRow
              title='Вибрация'
              hint='Когда таймер закончился'
              htmlFor='vibration'
            >
              <Switch
                id='vibration'
                checked={profile.timerVibration}
                disabled={update.isPending}
                onCheckedChange={timerVibration => update.mutate({ timerVibration })}
              />
            </SettingRow>
          </div>
        </>
      )}
    </ScreenSection>
  )
}
