import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Check, Plus } from 'lucide-react-native';

import { supersetCharge, supersetLetter, toBlocks, type WorkoutItem } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Poster } from '@/shared/ui/kit/Typography';

type WorkoutLanesProps = {
  items: WorkoutItem[];
  currentId: number;
  onPick: (id: number) => void;
};

// Больше дорожек в ряд не влезает: дальше переносим на вторую строку
const PER_ROW = 8;

// Частичный заряд суперсета снизу дорожки: видно, сколько кругов уже позади
const Charge = ({ value }: { value: number }) => {
  const still = useReducedMotion();
  const charge = useSharedValue(value);
  useEffect(() => {
    charge.set(still ? value : withTiming(value, { duration: 450 }));
  }, [charge, still, value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: charge.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      className="bg-primary absolute right-0 bottom-0 left-0 h-1"
      style={[{ transformOrigin: 'left' }, style]}
    />
  );
};

// Упражнения как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен.
// Суперсет — одна дорожка с буквой: заливается по сделанным подходам всех участников.
// Последняя ячейка «+» — добавить упражнение, если силы остались
export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => {
  const blocks = toBlocks(items);
  // Колонок столько же, сколько у фронта: repeat(min(блоков + 1, 8), 1fr) — ячейки равной ширины
  const columns = Math.min(blocks.length + 1, PER_ROW);
  const cell = { width: `${100 / columns}%` as const, paddingRight: 4 };
  let number = 0;

  return (
    <View className="flex-row flex-wrap px-gutter pt-3" style={{ rowGap: 4, marginRight: -4 }}>
      {blocks.map((block) => {
        const first = block.items[0]!;
        const isCurrent = block.items.some((e) => e.id === currentId);
        const charge = block.superset === null ? (first.done ? 1 : 0) : supersetCharge(block.items);
        const done = charge >= 1;
        const label = block.superset === null ? String(++number) : supersetLetter(block.superset);
        const name =
          block.superset === null ? first.name : `суперсет ${label}: ${block.items.map((e) => e.name).join(', ')}`;
        return (
          <View key={block.key} style={cell}>
            <Button
              variant={done ? 'default' : isCurrent ? 'alert' : 'outline'}
              size="sm"
              block
              onPress={() => onPick(first.id)}
              contentClassName={cn(
                'h-8 min-h-0 justify-between overflow-hidden px-1.5',
                isCurrent && 'border-2',
              )}
              accessibilityLabel={`${name}${done ? ', сделано' : ''}`}
            >
              {block.superset !== null && !done && <Charge value={charge} />}
              {/* Ещё не начатые — бледной меткой: взгляд цепляется за текущую и сделанные */}
              <Poster size="xs" className={cn(!done && !isCurrent && 'text-foreground/45')}>
                {label}
              </Poster>
              {done && <Icon as={Check} className="size-3" strokeWidth={3} />}
            </Button>
          </View>
        );
      })}
      <View style={cell}>
        <ButtonLink
          href={ROUTES.WORKOUT_ADD}
          variant="outline"
          size="sm"
          block
          contentClassName="h-8 min-h-0 px-1.5"
          accessibilityLabel="Добавить упражнение"
        >
          <Icon as={Plus} className="text-foreground/45 size-4" strokeWidth={3} />
        </ButtonLink>
      </View>
    </View>
  );
};
