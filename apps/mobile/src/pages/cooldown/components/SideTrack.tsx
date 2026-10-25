import { View } from 'react-native';
import { Check } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { Icon } from '@/shared/ui/kit/Icon';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';

const SIDES = ['Правая', 'Левая'] as const;

// Какую сторону тянем сейчас. Крупно над названием, а не значком на картинке:
// на низком экране картинка скрыта, и сторона пропадала вместе с ней
export const SideTrack = ({ side }: { side: 1 | 2 }) => (
  <View>
    <Eyebrow className="mb-2">
      сторона {side} из 2
    </Eyebrow>
    <View className="flex-row gap-2">
      {SIDES.map((label, i) => {
        const n = i + 1;
        return (
          <View
            key={label}
            className={cn(
              'border-foreground flex-1 items-center justify-center gap-1.5 border-[1.5px] py-3',
              n === side && 'bg-primary',
              n < side && 'border-border text-muted-foreground',
              n > side && 'border-border border-dashed text-foreground/40',
            )}
          >
            {n < side && <Icon as={Check} className="size-4" strokeWidth={2.5} />}
            <Poster size="sm">{label}</Poster>
          </View>
        );
      })}
    </View>
  </View>
);
