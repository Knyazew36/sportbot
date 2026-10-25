import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus } from 'lucide-react-native';

import {
  type StretchFormInput,
  stretchFormSchema,
  type StretchFormValues,
  useCreateDraft,
} from '@sportbot/api/entities/catalog';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Sheet } from '@/shared/ui/kit/Sheet';

import { SimilarEntries } from './SimilarEntries';
import { StretchFields } from './StretchFields';

type CreatedStretch = { id: number; name: string };

const DEFAULTS: StretchFormInput = {
  name: '',
  howTo: '',
  steps: [],
  mistakes: [],
  holdSeconds: '30',
  perSide: true,
  kind: 'COOLDOWN',
  imagePath: null,
  muscles: [],
};

const stretchHref = (id: number) => routeHref(ROUTES.STRETCH, { stretchId: id });

// Своя растяжка — всегда личной записью: публикация в справочник отдельно, с карточки.
// Прямое добавление в справочник у админа живёт в вебе — админку в мобилку не переносим
const CreateForm = ({ onCreated }: { onCreated: (stretch: CreatedStretch, pickedSimilar?: boolean) => void }) => {
  const createDraft = useCreateDraft();
  const form = useForm<StretchFormInput, unknown, StretchFormValues>({
    resolver: zodResolver(stretchFormSchema),
    defaultValues: DEFAULTS,
  });

  const submit = form.handleSubmit((values) =>
    createDraft
      .mutateAsync({
        kind: 'stretch',
        name: values.name,
        // У растяжки мышцы одного вида — в черновике они идут списком primary
        primary: values.muscles,
        technique: values.howTo ?? undefined,
        steps: values.steps,
        mistakes: values.mistakes,
        holdSeconds: values.holdSeconds,
        perSide: values.perSide,
        imagePath: values.imagePath ?? undefined,
      })
      // У только что созданного черновика запись есть всегда — null бывает лишь у удалённых
      .then((entry) => onCreated({ id: entry.id, name: entry.name }))
      .catch((error) => applyFieldErrors(error, form.setError)),
  );

  return (
    <FormProvider {...form}>
      <View className="gap-6 pt-1">
        <StretchFields
          afterName={(name) => (
            <SimilarEntries
              kind="stretch"
              name={name}
              hint="Не то? Заполни поля ниже — создадим новое."
              onPick={(entry) => onCreated(entry, true)}
            />
          )}
        />
        <Button size="lg" block icon={Plus} loading={createDraft.isPending} onPress={() => void submit()}>
          Сохранить
        </Button>
      </View>
    </FormProvider>
  );
};

type StretchCreateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Новая растяжка (business-tz, 5.5) — порт widgets/catalog/StretchCreateSheet.tsx, как новое упражнение
export const StretchCreateSheet = ({ open, onOpenChange }: StretchCreateSheetProps) => {
  const [created, setCreated] = useState<CreatedStretch | null>(null);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setCreated(null);
  };

  const done = (stretch: CreatedStretch, pickedSimilar?: boolean) => {
    if (pickedSimilar) {
      // Похожее уже есть в справочнике — показываем его карточку вместо создания дубля
      close(false);
      router.push(stretchHref(stretch.id));
    } else setCreated(stretch);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={created ? 'Сохранено' : 'Новая растяжка'}
      description={
        created
          ? `«${created.name}» уже может попасть в твою заминку. Чтобы она появилась в общем справочнике, нажми «Опубликовать» на карточке.`
          : 'Будет видна только тебе. В общий справочник — по кнопке «Опубликовать», после проверки.'
      }
    >
      {created ? (
        <View className="gap-3">
          <ButtonLink href={stretchHref(created.id)} variant="outline" block onNavigate={() => close(false)}>
            Открыть карточку
          </ButtonLink>
          <Button block icon={Check} onPress={() => close(false)}>
            Готово
          </Button>
        </View>
      ) : (
        open && <CreateForm onCreated={done} />
      )}
    </Sheet>
  );
};
