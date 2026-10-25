import { useWindowDimensions, View } from 'react-native';
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

export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => {
  const { width } = useWindowDimensions();
  const blocks = toBlocks(items);
  const count = Math.min(blocks.length + 1, 8);
  const cellWidth = (width - 32) / count - 4; // 32 = px-gutter * 2, 4 = gap
  let number = 0;

  return (
    <View className="flex-row gap-1 px-gutter pt-3">
      {blocks.map((block) => {
        const first = block.items[0]!;
        const isCurrent = block.items.some((e) => e.id === currentId);
        const charge = block.superset === null ? (first.done ? 1 : 0) : supersetCharge(block.items);
        const done = charge >= 1;
        const label = block.superset === null ? String(++number) : supersetLetter(block.superset);
        return (
          <View key={block.key} style={{ width: cellWidth }}>
            <Button
              variant={done ? 'default' : isCurrent ? 'alert' : 'outline'}
              size="sm"
              onPress={() => onPick(first.id)}
              className={cn('relative h-8 w-full justify-between overflow-hidden px-1.5', isCurrent && 'border-2')}
              accessibilityLabel={`${block.superset === null ? first.name : `суперсет ${label}: ${block.items.map((e) => e.name).join(', ')}`}${done ? ', сделано' : ''}`}
            >
              {block.superset !== null && !done && (
                <View
                  className="bg-primary absolute bottom-0 left-0 h-1"
                  style={{ width: `${charge * 100}%` }}
                />
              )}
              <Poster size="xs">{label}</Poster>
              {done && <Icon as={Check} className="size-3" strokeWidth={3} />}
            </Button>
          </View>
        );
      })}
      <View style={{ width: cellWidth }}>
        <ButtonLink
          href={ROUTES.WORKOUT_ADD}
          variant="outline"
          size="sm"
          className="text-foreground/45 h-8 w-full px-1.5"
          accessibilityLabel="Добавить упражнение"
        >
          <Icon as={Plus} className="size-4" strokeWidth={3} />
        </ButtonLink>
      </View>
    </View>
  );
};
