import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { Hatch } from '@/shared/ui/kit/Patterns';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { StatsSection } from './StatsSection';
import { Pressable } from '@/shared/ui/kit/Pressable';

export type MuscleLoadItem = { muscleId?: number; name: string; sets: number; forgotten?: boolean };

type MuscleLoadProps = {
  items: MuscleLoadItem[];
  title?: string;
  /** Пояснение к числам справа от заголовка */
  aside?: string;
  /** Что значат цифры */
  note?: string;
  /** Куда ведёт мышца: прогресс весов по ней. Без него строки не нажимаются (превью) */
  linkTo?: (item: MuscleLoadItem) => Href;
};

// Нагрузка по мышцам — порт widgets/stats/MuscleLoad.tsx: полосы в подходах, забытые группы заштрихованы
export const MuscleLoad = ({
  items,
  title = 'Нагрузка по мышцам',
  aside = 'подходов за неделю',
  note = 'Подходы на мышцу: основная в упражнении — 1, вспомогательная — 0,5.',
  linkTo,
}: MuscleLoadProps) => {
  const max = Math.max(...items.map((m) => m.sets), 1);
  return (
    <StatsSection title={title} aside={aside} note={note}>
      <View className="gap-2">
        {items.map((m, i) => (
          <MuscleRow key={m.name} to={linkTo?.(m)} label={`${m.name}: ${m.sets} подх.`}>
            {/* Колонки 84 · полоса · 44 · стрелка — grid-cols фронта */}
            <Text size="sm" tone={m.forgotten ? 'muted' : 'inherit'} numberOfLines={2} className="w-[84px]">
              {m.name}
            </Text>
            <View className="min-w-0 flex-1">
              {m.forgotten ? <Forgotten /> : <Bar share={m.sets / max} index={i} />}
            </View>
            <Poster size="sm" className="w-11 text-right">
              {m.sets.toString().replace('.', ',')}
            </Poster>
            {linkTo && <Icon as={ChevronRight} className="text-foreground/40 size-4" />}
          </MuscleRow>
        ))}
      </View>
    </StatsSection>
  );
};

/** Полоса подходов: вырастает слева лесенкой по строкам */
const Bar = ({ share, index }: { share: number; index: number }) => {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.set(withDelay(250 + index * 50, withTiming(share, { duration: 800, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })));
  }, [grow, index, share]);

  const style = useAnimatedStyle(() => ({ width: `${grow.value * 100}%` }));

  return (
    <View className="h-6">
      <Animated.View className="bg-primary h-full rounded-r-[4px]" style={style} />
    </View>
  );
};

const Forgotten = () => {
  const { colors } = useTheme();
  return (
    <View className="border-foreground/30 h-6 flex-row items-center overflow-hidden border border-dashed px-2">
      <Hatch color={colors.hatch} />
      <Eyebrow size="sm" className="bg-background text-foreground/70 px-1">
        забыто
      </Eyebrow>
    </View>
  );
};

type MuscleRowProps = { to?: Href; label: string; children: ReactNode };

// Строка мышцы: со ссылкой — вся строка нажимается и ведёт на прогресс весов
const MuscleRow = ({ to, label, children }: MuscleRowProps) => {
  const row = 'flex-row items-center gap-3';
  if (!to)
    return (
      <View accessibilityLabel={label} className={row}>
        {children}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => {
        haptic.tap();
        router.push(to);
      }}
      className={cn(row, 'active:bg-foreground/5 -mx-1 px-1 py-0.5')}
    >
      {children}
    </Pressable>
  );
};
