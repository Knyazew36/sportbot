import { View } from 'react-native';

import { type Profile } from '@sportbot/api/entities/profile';
import { useUpdateProfile } from '@/shared/local/entities/profile';

import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { SettingRow } from '@/shared/ui/kit/SettingRow';
import { Switch } from '@/shared/ui/kit/Switch';
import { Text } from '@/shared/ui/kit/Typography';

import { REST_OPTIONS, restLabel, WARMUP_OPTIONS } from '../model/options';

// Разминка и таймер отдыха — порт pages/me-section/components/TrainingSection.tsx.
// Переключатели сохраняются сразу — отдельной кнопки нет
export const TrainingSection = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const rest = String(profile.restSeconds);
  // Значение, выставленное в боте или старой версией, тоже должно быть видно
  const options = REST_OPTIONS.some((r) => r.value === rest)
    ? REST_OPTIONS
    : [...REST_OPTIONS, { value: rest, label: restLabel(profile.restSeconds) }];

  return (
    <ScreenSection className="gap-4">
      {/* Разминка не зависит от таймера отдыха: свой экран в начале тренировки */}
      <View className="gap-2">
        <Text size="sm" tone="soft">
          Разминка перед тренировкой
        </Text>
        <Segmented
          options={WARMUP_OPTIONS}
          value={String(profile.warmupMinutes)}
          onValueChange={(v) => update.mutate({ warmupMinutes: Number(v) })}
          stretch
        />
      </View>
      <SettingRow
        title="Таймер отдыха"
        hint={
          profile.showRestTimer
            ? 'Показывается после каждого подхода'
            : 'Скрыт: на экране тренировки только запись подходов и секундомер'
        }
        className="border-t-[1.5px]"
      >
        <Switch
          accessibilityLabel="Таймер отдыха"
          value={profile.showRestTimer}
          disabled={update.isPending}
          onValueChange={(showRestTimer) => update.mutate({ showRestTimer })}
        />
      </SettingRow>
      {/* Остальное про таймер имеет смысл, только пока он показывается */}
      {profile.showRestTimer && (
        <>
          <View className="gap-2">
            <Text size="sm" tone="soft">
              Отдых между подходами
            </Text>
            <Segmented
              options={options}
              value={rest}
              onValueChange={(v) => update.mutate({ restSeconds: Number(v) })}
              stretch
            />
          </View>
          <View>
            <SettingRow title="Автостарт таймера" hint="Отдых пойдёт сам после записи подхода" className="border-t-[1.5px]">
              <Switch
                accessibilityLabel="Автостарт таймера"
                value={profile.restAutoStart}
                disabled={update.isPending}
                onValueChange={(restAutoStart) => update.mutate({ restAutoStart })}
              />
            </SettingRow>
            <SettingRow title="Звук" hint="Когда таймер закончился">
              <Switch
                accessibilityLabel="Звук"
                value={profile.timerSound}
                disabled={update.isPending}
                onValueChange={(timerSound) => update.mutate({ timerSound })}
              />
            </SettingRow>
            <SettingRow title="Вибрация" hint="Когда таймер закончился">
              <Switch
                accessibilityLabel="Вибрация"
                value={profile.timerVibration}
                disabled={update.isPending}
                onValueChange={(timerVibration) => update.mutate({ timerVibration })}
              />
            </SettingRow>
          </View>
        </>
      )}
    </ScreenSection>
  );
};
