import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pause } from 'lucide-react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useEndPause, useStartPause } from '@sportbot/api/entities/pause';
import { type PauseInput, pauseSchema, type Profile } from '@sportbot/api/entities/profile';

import { applyFieldErrors } from '@/shared/lib/form';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/Button';
import { Notice } from '@/shared/ui/kit/Notice';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Text } from '@/shared/ui/kit/Typography';

import { TermFields } from './TermFields';

const PauseForm = () => {
  const start = useStartPause();
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PauseInput, unknown, string | null>({
    resolver: zodResolver(pauseSchema),
    defaultValues: { term: 'date', endDate: '' },
  });
  const term = useWatch({ control, name: 'term' });

  const save = handleSubmit((endDate) => start.mutateAsync(endDate).catch((error) => applyFieldErrors(error, setError)));

  return (
    <View className="gap-3">
      <Text tone="soft">Бот замолчит, а серия не сгорит — например, на время отпуска или болезни.</Text>
      <Controller
        control={control}
        name="endDate"
        render={({ field }) => (
          <TermFields
            term={term}
            onTermChange={(v) => setValue('term', v)}
            endDate={field.value}
            onEndDateChange={field.onChange}
            error={errors.endDate}
            dateLabel="Дата окончания паузы"
          />
        )}
      />
      <Button variant="outline" block icon={Pause} loading={start.isPending} onPress={() => void save()}>
        Поставить паузу
      </Button>
    </View>
  );
};

// Пауза «до даты» или «до отмены», снять досрочно — порт pages/me-section/components/PauseSection.tsx
export const PauseSection = ({ profile }: { profile: Profile }) => {
  const end = useEndPause();

  return (
    <ScreenSection aside="серия сохраняется">
      {profile.pause ? (
        <Notice
          kicker={profile.pause.endDate ? `до ${formatDate(profile.pause.endDate, 'd MMMM')}` : 'до отмены'}
          title={profile.pause.expired ? 'Пауза закончилась' : 'На паузе'}
          action={
            <Button size="sm" loading={end.isPending} onPress={() => end.mutate()}>
              {profile.pause.expired ? 'Вернуться' : 'Снять'}
            </Button>
          }
        />
      ) : (
        <PauseForm />
      )}
    </ScreenSection>
  );
};
