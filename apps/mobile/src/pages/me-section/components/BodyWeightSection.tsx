import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';

import {
  type BodyWeightInput,
  bodyWeightSchema,
  type BodyWeightValues,
  type Profile,
  useAddBodyWeight,
  useUpdateProfile,
} from '@sportbot/api/entities/profile';

import { applyFieldErrors } from '@/shared/lib/form';
import { BoxInput } from '@/shared/ui/kit/BoxInput';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { SelectField } from '@/shared/ui/kit/SelectField';
import { Text } from '@/shared/ui/kit/Typography';

import { WEIGHT_ASK_OPTIONS } from '../model/options';
import { BodyWeightChart } from './BodyWeightChart';

type Frequency = Profile['weightAskFrequency'];

// Вес тела — порт pages/me-section/components/BodyWeightSection.tsx: запись за сегодня, график по периодам,
// частота вопроса от бота
export const BodyWeightSection = ({ profile }: { profile: Profile }) => {
  const add = useAddBodyWeight();
  const update = useUpdateProfile();
  const last = profile.lastBodyWeight?.toString().replace('.', ',');
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BodyWeightInput, unknown, BodyWeightValues>({
    resolver: zodResolver(bodyWeightSchema),
    defaultValues: { value: '' },
  });

  const save = handleSubmit(({ value }) =>
    add
      .mutateAsync(value)
      .then(() => reset())
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <ScreenSection aside={last ? `последний ${last} кг` : undefined} className="gap-4">
      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="value"
          render={({ field: { value, onChange, onBlur } }) => (
            <BoxInput
              label="сегодня, кг"
              placeholder={last ?? '—'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="done"
              onSubmitEditing={() => void save()}
              className={errors.value ? 'border-destructive flex-1' : 'flex-1'}
            />
          )}
        />
        <Button icon={Check} loading={add.isPending} onPress={() => void save()} className="self-stretch">
          Записать
        </Button>
      </View>
      <ErrorText errors={errors.value} />
      <BodyWeightChart />
      <View className="gap-2">
        <Text size="sm" tone="soft">
          Бот спрашивает вес
        </Text>
        <SelectField
          options={WEIGHT_ASK_OPTIONS}
          value={profile.weightAskFrequency}
          onValueChange={(v) => update.mutate({ weightAskFrequency: v as Frequency })}
          ariaLabel="Как часто бот спрашивает вес"
        />
      </View>
    </ScreenSection>
  );
};
