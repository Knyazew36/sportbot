import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { CooldownStretch } from '@sportbot/api/entities/workout';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

const MUSCLE_FORMS = ['мышца', 'мышцы', 'мышц'] as const;

type MuscleCount = { name: string; count: number };

/** Больше строк экран-предложение не вмещает: кнопки в футере должны остаться видны без прокрутки */
const VISIBLE = 6;

// Моно-метка для нумерации — mono-label фронта
const MONO = 'font-mono text-[12px] leading-[15.6px] tracking-[-0.36px]';

// Мышцы основного блока с числом растяжек на каждую: у растяжки они перечислены через запятую.
// Сначала самые проработанные — на них заминка и рассчитана
const countMuscles = (stretches: CooldownStretch[]): MuscleCount[] => {
  const counts = new Map<string, number>();
  for (const stretch of stretches)
    for (const raw of stretch.muscles.split(',')) {
      const name = raw.trim().toLowerCase();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Полоса «потягивается» с упругим докатом — само движение и есть растяжка
const Bar = ({ share, index }: { share: number; index: number }) => {
  const still = useReducedMotion();
  const scale = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    scale.set(withDelay(250 + index * 70, withSpring(1, { stiffness: 260, damping: 14 })));
  }, [index, scale, still]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: scale.value }] }));
  return (
    // Дорожка: разметка под полосой — сколько растяжек могло бы быть у самой проработанной мышцы
    <View className="bg-foreground/10 h-2.5 w-22 shrink-0 overflow-hidden">
      <Animated.View
        className="bg-primary absolute top-0 bottom-0 left-0"
        style={[{ width: `${share * 100}%`, transformOrigin: 'left' }, style]}
      />
    </View>
  );
};

// Что растянет заминка: каждая мышца — дорожка, полоса тянется на столько, сколько на неё растяжек.
// Полосы «потягиваются» по очереди
export const StretchMuscles = ({ stretches }: { stretches: CooldownStretch[] }) => {
  const muscles = countMuscles(stretches);
  if (!muscles.length) return null;

  const shown = muscles.slice(0, VISIBLE);
  const rest = muscles.length - shown.length;
  const max = shown[0]!.count;

  return (
    <View className="border-foreground mt-6 border-t-[3px]">
      <View className="flex-row items-baseline justify-between gap-3 py-2">
        <Eyebrow>Растянем то, что работало</Eyebrow>
        <Text className={`${MONO} text-foreground/50 shrink-0`}>{pluralize(muscles.length, [...MUSCLE_FORMS])}</Text>
      </View>

      {shown.map((m, i) => (
        <View key={m.name} className="border-foreground/15 flex-row items-center gap-2 border-t py-2">
          <Text className={`${MONO} text-foreground/40 w-7 shrink-0`}>{String(i + 1).padStart(2, '0')}</Text>
          <Text className="min-w-0 flex-1" numberOfLines={1}>
            {capitalize(m.name)}
          </Text>
          <Bar share={m.count / max} index={i} />
          <Poster
            size="md"
            numeric
            className="w-6 shrink-0 text-right"
            accessibilityLabel={pluralize(m.count, STRETCH_FORMS)}
          >
            {String(m.count)}
          </Poster>
        </View>
      ))}

      {rest > 0 && (
        <Text size="sm" tone="soft" className="border-foreground/15 border-t pt-2">
          и ещё {pluralize(rest, [...MUSCLE_FORMS])}
        </Text>
      )}
    </View>
  );
};
