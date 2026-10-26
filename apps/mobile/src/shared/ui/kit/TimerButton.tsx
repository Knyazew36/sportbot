import { View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { Ring } from './Ring';
import { Poster, TextClassContext } from './Typography';
import { Pressable } from './Pressable';

type TimerButtonProps = {
  /** Осталось секунд */
  left: number;
  total: number;
  paused: boolean;
  onToggle: () => void;
  className?: string;
};

// Таймер удержания, совмещённый с управлением — порт shared/ui/kit/TimerButton.tsx: кольцо отсчёта вокруг
// кнопки паузы, секунды — на самой кнопке. Палец и взгляд в одной точке внизу экрана
export const TimerButton = ({ left, total, paused, onToggle, className }: TimerButtonProps) => {
  const seconds = Math.max(left, 0);
  const textClass = paused ? 'text-foreground' : 'text-primary-foreground';

  return (
    <View className={cn('size-[124px] shrink-0', className)}>
      <Ring
        value={total > 0 ? seconds / total : 0}
        sweep={paused || total <= 0 ? undefined : { to: 0, ms: seconds * 1000 }}
        size={124}
        stroke={6}
        className="absolute inset-0"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? `Продолжить, осталось ${seconds} секунд` : `Пауза, осталось ${seconds} секунд`}
        onPress={() => {
          haptic.tap();
          onToggle();
        }}
        className="absolute inset-[20px]"
      >
        {({ pressed }) => (
          <TextClassContext.Provider value={textClass}>
            {/* Тень — круг под кнопкой; при нажатии кнопка садится на неё, как у Button */}
            <View className="bg-sb-ink absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-full" />
            <View
              className={cn(
                'border-foreground size-full items-center justify-center rounded-full border-[1.5px]',
                paused ? 'bg-background' : 'bg-primary',
                pressed && 'translate-x-[3px] translate-y-[3px]',
              )}
            >
              <Poster size="xl" numeric>
                {String(seconds)}
              </Poster>
              <Icon as={paused ? Play : Pause} className="mt-0.5 size-4" />
            </View>
          </TextClassContext.Provider>
        )}
      </Pressable>
    </View>
  );
};
