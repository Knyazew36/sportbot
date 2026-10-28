import type { ReactNode } from 'react';
import { View } from 'react-native';

import { exerciseGuide, stretchGuide, type CatalogKind } from '@sportbot/api/entities/catalog';
import { useCatalogExercise, useCatalogStretch } from '@/shared/local/entities/catalog';

import { toAssetUrl } from '@/shared/api';
import { Badge } from '@/shared/ui/kit/Badge';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { MistakeList, StepList } from '@/shared/ui/kit/StepList';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { ImageCredit } from '@/widgets/catalog/ImageCredit';

type ExerciseSheetProps = {
  /** Открытое упражнение; null — шторка закрыта. Название сразу в заголовке, пока карточка грузится */
  exercise: { id: number; name: string } | null;
  /** Растяжка показывается своей карточкой: удержание и «как делать» вместо техники */
  kind?: CatalogKind;
  onOpenChange: (open: boolean) => void;
  /** Действие внизу шторки: «Заменить на это», «Подробнее» */
  action?: ReactNode;
};

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <View className="gap-2">
    <Eyebrow>{title}</Eyebrow>
    {children}
  </View>
);

// Карточка упражнения: фото, мышцы, техника
const ExerciseDetails = ({ id }: { id: number }) => {
  const exercise = useCatalogExercise(id);
  return (
    <QueryState query={exercise}>
      {(e) => {
        const { steps, mistakes } = exerciseGuide(e);
        return (
          <View className="gap-4">
            <PhotoPair start={toAssetUrl(e.imageUrl) ?? null} end={toAssetUrl(e.imageEndUrl) ?? null} alt={e.name} />
            <ImageCredit credit={e.imageCredit} />
            <View className="flex-row flex-wrap gap-1.5">
              {e.primaryMuscles.map((m) => (
                <Badge key={m.id}>{m.name}</Badge>
              ))}
              {e.secondaryMuscles.map((m) => (
                <Badge key={m.id} variant="outline">
                  {m.name}
                </Badge>
              ))}
            </View>
            {steps.length > 0 && (
              <Block title="Техника">
                <StepList items={steps} />
              </Block>
            )}
            {mistakes.length > 0 && (
              <Block title="Ошибки">
                <MistakeList items={mistakes} />
              </Block>
            )}
          </View>
        );
      }}
    </QueryState>
  );
};

// Карточка растяжки: фото, мышцы, удержание, как делать
const StretchDetails = ({ id }: { id: number }) => {
  const stretch = useCatalogStretch(id);
  return (
    <QueryState query={stretch}>
      {(s) => {
        const guide = stretchGuide(s);
        return (
          <View className="gap-4">
            <PhotoPair start={toAssetUrl(s.imageUrl) ?? null} end={toAssetUrl(s.imageEndUrl) ?? null} alt={s.name} />
            <ImageCredit credit={s.imageCredit} />
            <View className="flex-row flex-wrap gap-1.5">
              {s.muscles.map((m) => (
                <Badge key={m.id}>{m.name}</Badge>
              ))}
            </View>
            <Block title="Удержание">
              <Text>
                {s.holdSeconds} с{s.perSide ? ', на каждую сторону' : ''}
              </Text>
            </Block>
            {guide.steps.length > 0 && (
              <Block title="Как делать">
                <StepList items={guide.steps} />
              </Block>
            )}
            {guide.mistakes.length > 0 && (
              <Block title="Ошибки">
                <MistakeList items={guide.mistakes} />
              </Block>
            )}
          </View>
        );
      }}
    </QueryState>
  );
};

// Что за упражнение, не уходя с экрана — порт widgets/exercise-sheet/ExerciseSheet.tsx:
// замена на тренировке, состав комплекса дня
export const ExerciseSheet = ({ exercise, kind = 'exercise', onOpenChange, action }: ExerciseSheetProps) => (
  <Sheet open={exercise != null} onOpenChange={onOpenChange} title={exercise?.name} footer={action}>
    {exercise && (kind === 'exercise' ? <ExerciseDetails id={exercise.id} /> : <StretchDetails id={exercise.id} />)}
  </Sheet>
);
