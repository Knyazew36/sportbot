import type { ReactNode } from 'react';
import { View } from 'react-native';
import { GripVertical, Link2, Trash2 } from 'lucide-react-native';

import type { ComplexExerciseValues, ProgramExercise } from '@sportbot/api/entities/program';

import { haptic } from '@/shared/lib/haptics';
import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Text } from '@/shared/ui/kit/Typography';

import { ExercisePlanForm } from './ExercisePlanForm';
import { Pressable } from '@/shared/ui/kit/Pressable';

type ComplexExerciseRowProps = {
  exercise: ProgramExercise;
  /** Обёртка ручки от Sortable: тянется только за неё */
  handle: (child: ReactNode) => ReactNode;
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>;
  onRemove: () => void;
  /** Открыть карточку упражнения: фото, мышцы, техника */
  onView: () => void;
  /** Подбор упражнений, которые встанут с этим в суперсет */
  supersetTo: string;
};

/** Ручка перетаскивания — общая у строк, суперсетов и тренировок программы */
export const Grip = ({ label, className = 'h-10 w-8' }: { label: string; className?: string }) => (
  <View accessibilityLabel={label} accessibilityHint="Удерживай и тяни" className={`items-center justify-center ${className}`}>
    <Icon as={GripVertical} className="text-foreground/50 size-5" />
  </View>
);

// Одиночное упражнение комплекса — порт widgets/program-editor/ComplexExerciseRow.tsx:
// план «3 × 8–12» правится на месте и сохраняется, когда фокус уходит из полей плана
export const ComplexExerciseRow = ({
  exercise,
  handle,
  onPlanChange,
  onRemove,
  onView,
  supersetTo,
}: ComplexExerciseRowProps) => (
  <View className="bg-background border-border flex-row items-start gap-x-2 border-b-[1.5px] py-3.5">
    {handle(<Grip label={`Перетащить «${exercise.name}»`} />)}
    <View className="min-w-0 flex-1">
      {/* Тап по названию открывает карточку, как в ленте суперсета: отдельная кнопка не влезала в ряд плана */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Посмотреть «${exercise.name}»`}
        onPress={() => {
          haptic.tap();
          onView();
        }}
        className="active:opacity-70"
      >
        <Text size="lg" className="leading-[20px]">
          {exercise.name}
        </Text>
        <Text size="xs" tone="muted" className="mt-1">
          {exercise.muscles}
        </Text>
      </Pressable>
      {exercise.draft ? (
        <Badge variant="outline" className="mt-2">
          не проверено
        </Badge>
      ) : null}
      <ExercisePlanForm exercise={exercise} onPlanChange={onPlanChange} className="mt-2">
        <View className="ml-auto flex-row gap-1.5">
          <ButtonLink
            href={supersetTo}
            variant="outline"
            size="icon-sm"
            accessibilityLabel={`Собрать суперсет с «${exercise.name}»`}
          >
            <Icon as={Link2} className="size-4" />
          </ButtonLink>
          <Button
            variant="outline"
            size="icon-sm"
            accessibilityLabel={`Удалить «${exercise.name}» из тренировки`}
            onPress={onRemove}
          >
            <Icon as={Trash2} className="text-destructive size-4" />
          </Button>
        </View>
      </ExercisePlanForm>
    </View>
  </View>
);
