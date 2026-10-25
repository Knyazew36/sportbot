import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program';

import { haptic } from '@/shared/lib/haptics';
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/kit/Badge';
import { Icon } from '@/shared/ui/kit/Icon';
import { Poster, Text } from '@/shared/ui/kit/Typography';

import { Grip } from './ComplexExerciseRow';
import { Pressable } from '@/shared/ui/kit/Pressable';

// Сколько упражнений показать в строке: больше — строка распухает, меньше — не видно, что это тренировка
const PREVIEW = 3;

type ProgramComplexRowProps = {
  complex: ProgramComplex;
  index: number;
  /** Экран комплекса */
  to: string;
  /** Обёртка ручки от Sortable */
  handle: (child: ReactNode) => ReactNode;
};

// Тренировка в очереди программы — порт widgets/program-editor/ProgramComplexRow.tsx: ручка для перетаскивания
// и переход на её экран. Первые упражнения видны прямо в строке — понятно, что это целое занятие, а не папка
export const ProgramComplexRow = ({ complex, index, to, handle }: ProgramComplexRowProps) => {
  const names = complex.exercises.slice(0, PREVIEW).map((e) => e.name);
  const more = complex.exercises.length - names.length;
  const sets = complex.exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <View
      className={cn(
        'bg-background flex-row items-stretch border-[1.5px]',
        complex.isNext ? 'border-primary' : 'border-foreground/80',
      )}
    >
      {handle(<Grip label={`Перетащить тренировку «${complex.name}»`} className="h-full w-10" />)}
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          haptic.tap();
          router.push(to as Href);
        }}
        className="active:bg-accent min-w-0 flex-1 flex-row items-center gap-3 py-3 pr-3"
      >
        <Poster size="xl" tone={complex.isNext ? 'primary' : 'faint'} className="w-7">
          {complexLetter(index)}
        </Poster>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text size="lg" numberOfLines={1} className="min-w-0 shrink">
              {complex.name}
            </Text>
            {complex.isNext && <Badge className="h-5 shrink-0">следующая</Badge>}
          </View>
          {names.length > 0 ? (
            <>
              <Text size="sm" tone="soft" numberOfLines={2} className="mt-1">
                {names.join(' · ')}
                {more > 0 && ` · ещё ${more}`}
              </Text>
              <Text size="xs" tone="muted" className="mt-1">
                {pluralize(complex.exercises.length, EXERCISE_FORMS)} · {pluralize(sets, SET_FORMS)}
              </Text>
            </>
          ) : (
            <Text size="xs" tone="muted" className="mt-0.5">
              пусто — добавь упражнения
            </Text>
          )}
        </View>
        <Icon as={ChevronRight} className="text-foreground/60 size-5" />
      </Pressable>
    </View>
  );
};
