import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus } from 'lucide-react-native';

import {
  type ExerciseCreateInput,
  exerciseCreateSchema,
  type ExerciseCreateValues,
  useCreateDraft,
} from '@sportbot/api/entities/catalog';
import { ROUTES } from '@/shared/config/routes';
import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Sheet } from '@/shared/ui/kit/Sheet';

import { ExerciseFields } from './ExerciseFields';
import { SimilarEntries } from './SimilarEntries';

/** draft — только что создано личной записью (а не похожее из справочника) */
export type CreatedExercise = { id: number; name: string; draft?: boolean };

const DEFAULTS: ExerciseCreateInput = {
  name: '',
  technique: '',
  steps: [],
  mistakes: [],
  videoUrl: '',
  equipment: null,
  measure: 'REPS',
  imagePath: null,
  primary: [],
  secondary: [],
  jointIds: [],
};

type CreateFormProps = {
  onCreated: (exercise: CreatedExercise, pickedSimilar?: boolean) => void;
};

// Своё упражнение — всегда личной записью: публикация в справочник отдельно, с карточки.
// Прямое добавление в справочник у админа живёт в вебе — админку в мобилку не переносим
const CreateForm = ({ onCreated }: CreateFormProps) => {
  const createDraft = useCreateDraft();
  const form = useForm<ExerciseCreateInput, unknown, ExerciseCreateValues>({
    resolver: zodResolver(exerciseCreateSchema),
    defaultValues: DEFAULTS,
  });

  const submit = form.handleSubmit((values) =>
    createDraft
      .mutateAsync({
        kind: 'exercise',
        ...values,
        technique: values.technique ?? undefined,
        videoUrl: values.videoUrl ?? undefined,
        equipment: values.equipment ?? undefined,
        imagePath: values.imagePath ?? undefined,
      })
      .then((entry) => onCreated({ id: entry.id, name: entry.name, draft: true }))
      .catch((error) => applyFieldErrors(error, form.setError)),
  );

  return (
    <FormProvider {...form}>
      <View className="gap-6 pt-1">
        <ExerciseFields
          afterName={(name) => (
            <SimilarEntries
              kind="exercise"
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

type ExerciseCreateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Созданное (или выбранное похожее из справочника) сразу уходит наружу вместо экрана «Готово» —
   * так замена на тренировке ставит его без лишних шагов
   */
  onCreated?: (exercise: CreatedExercise) => void;
};

const exerciseHref = (id: number) => ({ pathname: ROUTES.EXERCISE, params: { exerciseId: String(id) } });

// Новое упражнение (business-tz, 5.5) — порт widgets/catalog/ExerciseCreateSheet.tsx:
// одна шторка для всех входов — справочник, подбор, замена на тренировке
export const ExerciseCreateSheet = ({ open, onOpenChange, onCreated }: ExerciseCreateSheetProps) => {
  const [created, setCreated] = useState<CreatedExercise | null>(null);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setCreated(null);
  };

  const done = (exercise: CreatedExercise, pickedSimilar?: boolean) => {
    if (onCreated) {
      onCreated(exercise);
      close(false);
    } else if (pickedSimilar) {
      // Похожее уже есть в справочнике — показываем его карточку вместо создания дубля
      close(false);
      router.push(exerciseHref(exercise.id));
    } else setCreated(exercise);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={created ? 'Сохранено' : 'Новое упражнение'}
      description={
        created
          ? `«${created.name}» уже можно ставить в тренировки. Чтобы оно появилось в общем справочнике, нажми «Опубликовать» на карточке.`
          : 'Будет видно только тебе. В общий справочник — по кнопке «Опубликовать», после проверки.'
      }
    >
      {created ? (
        <View className="gap-3">
          <ButtonLink href={exerciseHref(created.id)} variant="outline" block onNavigate={() => close(false)}>
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
