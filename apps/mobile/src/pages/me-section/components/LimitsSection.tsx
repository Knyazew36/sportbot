import { useState } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useJoints } from '@sportbot/api/entities/catalog';
import { useCreateLimitation, useDeleteLimitation, useLimitations } from '@sportbot/api/entities/limitation';
import { type LimitationInput, limitationSchema, type LimitationValues } from '@sportbot/api/entities/profile';

import { applyFieldErrors } from '@/shared/lib/form';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { SelectField } from '@/shared/ui/kit/SelectField';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

import { TermFields } from './TermFields';

const LimitationForm = ({ onDone }: { onDone: () => void }) => {
  const joints = useJoints();
  const create = useCreateLimitation();
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LimitationInput, unknown, LimitationValues>({
    resolver: zodResolver(limitationSchema),
    defaultValues: { jointId: 0, term: 'date', endDate: '' },
  });
  const term = useWatch({ control, name: 'term' });

  const save = handleSubmit((values) =>
    create
      .mutateAsync(values)
      .then(onDone)
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <View className="gap-4 pb-2">
      <View className="gap-2">
        <Text size="sm" tone="soft">
          Зона
        </Text>
        <Controller
          control={control}
          name="jointId"
          render={({ field }) => (
            <SelectField
              options={(joints.data ?? []).map((j) => ({ value: String(j.id), label: j.name }))}
              value={field.value ? String(field.value) : ''}
              onValueChange={(v) => field.onChange(Number(v))}
              ariaLabel="Зона"
            />
          )}
        />
        <ErrorText errors={errors.jointId} />
      </View>
      <View className="gap-2">
        <Text size="sm" tone="soft">
          Срок
        </Text>
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
              dateLabel="До какой даты"
            />
          )}
        />
      </View>
      <Button size="lg" block loading={create.isPending} onPress={() => void save()}>
        Добавить
      </Button>
    </View>
  );
};

// Ограничения по суставам — порт pages/me-section/components/LimitsSection.tsx: ⚠️ в комплексе
// и фильтр аналогов при замене
export const LimitsSection = () => {
  const limitations = useLimitations();
  const remove = useDeleteLimitation();
  const [open, setOpen] = useState(false);

  return (
    <ScreenSection aside="бот предупредит в тренировке">
      {limitations.data?.length ? (
        <List>
          {limitations.data.map((l) => (
            <ListRow
              key={l.id}
              title={l.jointName}
              meta={l.endDate ? `до ${formatDate(l.endDate, 'd MMMM')}` : 'до отмены'}
              trail={
                <Button variant="outline" size="xs" disabled={remove.isPending} onPress={() => remove.mutate(l.id)}>
                  Снять
                </Button>
              }
            />
          ))}
        </List>
      ) : (
        <Text tone="muted">Ограничений нет. Добавь, если что-то болит — бот подскажет замену.</Text>
      )}
      <Button variant="outline" size="sm" icon={Plus} className="self-start" onPress={() => setOpen(true)}>
        Добавить ограничение
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Ограничение"
        // Дисклеймер при включении ограничения (frontend-tz, 13.4)
        description="Это подсказка для подбора упражнений, она не заменяет врача."
      >
        {open && <LimitationForm onDone={() => setOpen(false)} />}
      </Sheet>
    </ScreenSection>
  );
};
