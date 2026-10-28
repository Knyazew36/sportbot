import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Plus, Trash2, Unlink2 } from 'lucide-react-native';

import { type ComplexExerciseValues, type ExerciseBlock, planText, type ProgramExercise, supersetLetter } from '@sportbot/api/entities/program';

import { haptic } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sortable } from '@/shared/ui/kit/Sortable';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

import { Grip } from './ComplexExerciseRow';
import { ExercisePlanForm } from './ExercisePlanForm';
import { Pressable } from '@/shared/ui/kit/Pressable';

type SupersetCardProps = {
  exercise: ProgramExercise;
  label: string;
  handle: (child: ReactNode) => ReactNode;
  onOpen: () => void;
};

// Карточка участника в ленте суперсета: тап открывает план и действия, ручка двигает по кругу
const SupersetCard = ({ exercise, label, handle, onOpen }: SupersetCardProps) => (
  <View className="bg-background border-border h-full w-[152px] border-[1.5px]">
    <View className="flex-row items-center justify-between pl-3">
      <Eyebrow tone="primary">{label}</Eyebrow>
      {handle(<Grip label={`Перетащить «${exercise.name}» в суперсете`} className="size-9" />)}
    </View>
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.tap();
        onOpen();
      }}
      className="active:bg-mist flex-1 items-start gap-1 px-3 pb-3"
    >
      <Text size="sm" numberOfLines={2} className="leading-[17px]">
        {exercise.name}
      </Text>
      <Text size="xs" tone="muted" className="mt-auto">
        {planText(exercise.sets, exercise.repsMin, exercise.repsMax, exercise.measure)}
        {exercise.draft && ' · не проверено'}
      </Text>
    </Pressable>
  </View>
);

type SupersetBlockProps = {
  block: ExerciseBlock<ProgramExercise> & { superset: number };
  /** Обёртка ручки блока от Sortable комплекса */
  handle: (child: ReactNode) => ReactNode;
  /** Новый порядок участников внутри суперсета */
  onReorder: (ids: number[]) => void;
  onPlanChange: (id: number, plan: ComplexExerciseValues) => Promise<unknown>;
  onRemove: (id: number) => void;
  onUngroupExercise: (id: number) => void;
  onUngroup: () => void;
  /** Подбор упражнений, которые встанут в этот суперсет */
  addTo: string;
};

// Суперсет в редакторе — порт widgets/program-editor/SupersetBlock.tsx: блок во всю ширину, участники — лентой в ряд.
// Делаются по кругу, отдых после круга
export const SupersetBlock = ({
  block,
  handle,
  onReorder,
  onPlanChange,
  onRemove,
  onUngroupExercise,
  onUngroup,
  addTo,
}: SupersetBlockProps) => {
  const letter = supersetLetter(block.superset);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const opened = block.items.find((e) => e.id === openedId) ?? null;
  const close = () => setOpenedId(null);

  const reorder = (keys: React.Key[]) => {
    const ids = keys.map(Number);
    if (ids.some((id, i) => id !== block.items[i]?.id)) onReorder(ids);
  };

  return (
    <View className="bg-background border-border border-b-[1.5px] py-3.5">
      <View className="flex-row items-center gap-2">
        {handle(<Grip label={`Перетащить суперсет ${letter}`} />)}
        <View className="min-w-0 flex-1">
          <Text size="lg" className="leading-[20px]">
            Суперсет {letter}
          </Text>
          <Text size="xs" tone="muted">
            по кругу, отдых после круга
          </Text>
        </View>
        <Button variant="outline" size="icon-sm" accessibilityLabel={`Разгруппировать суперсет ${letter}`} onPress={onUngroup}>
          <Icon as={Unlink2} className="size-4" />
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mr-gutter mt-3"
        contentContainerClassName="pr-gutter pb-1 pl-10"
      >
        <Sortable
          axis="x"
          gap={8}
          items={block.items}
          keyOf={(e) => e.id}
          onReorder={reorder}
          renderItem={(e, cardHandle, i) => (
            <SupersetCard
              exercise={e}
              label={`${letter}${i + 1}`}
              handle={cardHandle}
              onOpen={() => setOpenedId(e.id)}
            />
          )}
          footer={
            <ButtonLink
              href={addTo}
              variant="outline"
              className="self-stretch"
              contentClassName="h-full w-16 px-0"
              accessibilityLabel={`Добавить упражнение в суперсет ${letter}`}
            >
              <Icon as={Plus} strokeWidth={2.5} className="size-5" />
            </ButtonLink>
          }
        />
      </ScrollView>

      <ExerciseSheet
        exercise={opened && { id: opened.exerciseId, name: opened.name }}
        onOpenChange={(open) => !open && close()}
        action={
          opened ? (
            <View className="gap-3">
              <ExercisePlanForm exercise={opened} onPlanChange={(plan) => onPlanChange(opened.id, plan)} />
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  block
                  icon={Unlink2}
                  className="flex-1"
                  onPress={() => {
                    onUngroupExercise(opened.id);
                    close();
                  }}
                >
                  Вынести
                </Button>
                <Button
                  variant="destructive"
                  block
                  icon={Trash2}
                  className="flex-1"
                  onPress={() => {
                    onRemove(opened.id);
                    close();
                  }}
                >
                  Удалить
                </Button>
              </View>
            </View>
          ) : undefined
        }
      />
    </View>
  );
};
