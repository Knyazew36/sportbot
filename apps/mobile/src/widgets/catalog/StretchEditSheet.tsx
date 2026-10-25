import { useState } from 'react';
import { View } from 'react-native';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Send } from 'lucide-react-native';

import {
  type CatalogStretch,
  type StretchProposalInput,
  stretchProposalSchema,
  type StretchProposalValues,
  toTextList,
  useProposeStretch,
} from '@sportbot/api/entities/catalog';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Input } from '@/shared/ui/kit/Input';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

import { StretchFields } from './StretchFields';

type StretchEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stretch: CatalogStretch;
};

// Картинку здесь не меняют: выбор фото с устройства — отдельная задача (expo-image-picker), как в ExerciseEditSheet
const ProposalForm = ({ stretch, onSent }: { stretch: CatalogStretch; onSent: () => void }) => {
  const propose = useProposeStretch();
  const form = useForm<StretchProposalInput, unknown, StretchProposalValues>({
    resolver: zodResolver(stretchProposalSchema),
    defaultValues: {
      name: stretch.name,
      howTo: stretch.howTo ?? '',
      steps: toTextList(stretch.steps),
      mistakes: toTextList(stretch.mistakes),
      holdSeconds: String(stretch.holdSeconds),
      perSide: stretch.perSide,
      muscles: stretch.muscles.map((m) => m.id),
      comment: '',
    },
  });
  const { comment: _comment, ...changed } = form.formState.dirtyFields;
  const errors = form.formState.errors;

  // Бэк сам оставит только реально изменённые поля — шлём форму целиком
  const submit = form.handleSubmit(({ comment, ...values }) =>
    propose
      .mutateAsync({ stretchId: stretch.id, comment: comment || undefined, ...values })
      .then(onSent)
      .catch((error) => applyFieldErrors(error, form.setError)),
  );

  return (
    <FormProvider {...form}>
      <View className="gap-6 pt-1">
        <Text size="sm" tone="muted">
          Поправь, что неверно. Запись изменится после проверки администратором.
        </Text>
        <StretchFields />
        <View className="gap-3">
          <Eyebrow tone="primary">Комментарий</Eyebrow>
          <Controller
            control={form.control}
            name="comment"
            render={({ field }) => (
              <View className="gap-1.5">
                <Text size="sm" tone="soft">
                  Что было не так
                </Text>
                <Input
                  multiline
                  textAlignVertical="top"
                  placeholder="Например: на картинке другое упражнение"
                  accessibilityLabel="Что было не так"
                  maxLength={500}
                  invalid={!!errors.comment}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  className="h-auto min-h-24 py-3"
                />
                <ErrorText errors={errors.comment} />
              </View>
            )}
          />
        </View>
        <Button
          size="lg"
          block
          icon={Send}
          loading={propose.isPending}
          // Один комментарий — не правка: для него есть жалоба текстом
          disabled={!Object.keys(changed).length}
          onPress={() => void submit()}
        >
          На модерацию
        </Button>
      </View>
    </FormProvider>
  );
};

// «Предложить правку» растяжки — порт widgets/catalog/StretchEditSheet.tsx: правка полями уходит администратору
export const StretchEditSheet = ({ open, onOpenChange, stretch }: StretchEditSheetProps) => {
  const [sent, setSent] = useState(false);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setSent(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={sent ? 'Спасибо!' : 'Предложить правку'}
      description={sent ? 'Правка у администратора. Бот напишет, когда её проверят.' : `«${stretch.name}»`}
    >
      {sent ? (
        <Button variant="outline" block icon={Check} onPress={() => close(false)}>
          Готово
        </Button>
      ) : (
        open && <ProposalForm stretch={stretch} onSent={() => setSent(true)} />
      )}
    </Sheet>
  );
};
