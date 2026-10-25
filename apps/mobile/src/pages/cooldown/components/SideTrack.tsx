import { View } from 'react-native';
import { Check } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';

const SIDES = ['Правая', 'Левая'] as const;

// Какую сторону тянем сейчас. Крупно над названием, а не значком на картинке:
// на низком экране картинка скрыта, и сторона пропадала вместе с ней.
// Цвет текста задаём самим подписям: в RN он не наследуется от рамки
export const SideTrack = ({ side }: { side: 1 | 2 }) => {
  const { scheme } = useTheme();
  return (
  <View>
    <Eyebrow className="mb-2">сторона {side} из 2</Eyebrow>
    <View className="flex-row gap-2">
      {SIDES.map((label, i) => {
        const n = i + 1;
        const tone = n === side ? 'text-primary-foreground' : n < side ? 'text-muted-foreground' : 'text-foreground/40';
        return (
          <View key={label} className="flex-1">
            {/* Текущая сторона — с жёсткой тенью, как кнопка: на неё смотрим. В тёмной теме тень светлая и слепит — без неё */}
            {n === side && scheme === 'light' && <View className="bg-sb-ink absolute inset-0 translate-x-[3px] translate-y-[3px]" />}
            <View
              className={cn(
                'h-12 flex-row items-center justify-center gap-1.5 border-[1.5px]',
                n === side && 'border-foreground bg-primary',
                n < side && 'border-border bg-background',
                n > side && 'border-border bg-background border-dashed',
              )}
            >
              {n < side && <Icon as={Check} className={cn('size-4', tone)} strokeWidth={2.5} />}
              <Poster size="sm" className={tone}>
                {label}
              </Poster>
            </View>
          </View>
        );
      })}
    </View>
  </View>
);
};
