import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Play, Pause } from 'lucide-react-native';

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Ring } from '@/shared/ui/kit/Ring';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';
import { Pressable } from '@/shared/ui/kit/Pressable';

type SideAction = { label: string; icon: LucideIcon; onPress: () => void };

type HoldControlsProps = {
  holdSeconds: number;
  /** Для растяжки «на каждую сторону» — какая сторона сейчас; иначе подпись стороны не показывается */
  side?: 1 | 2;
  back: SideAction;
  next: SideAction;
  /** Время удержания вышло — один раз: звук и вибрация. Дальше человек переходит сам */
  onEnd?: () => void;
  /** Отсчёт сразу, без нажатия: «Попробовать" в карточке растяжки — человек уже нажал старт */
  autoStart?: boolean;
};

// Низ экрана удержания растяжки: таймер вокруг кнопки паузы и два перехода по бокам.
// В заминке отсчёт ждёт нажатия: сначала прочитать, как встать, и только потом держать
export const HoldControls = ({ holdSeconds, side, back, next, onEnd, autoStart = false }: HoldControlsProps) => {
  const [started, setStarted] = useState(autoStart);
  const [paused, setPaused] = useState(!autoStart);
  const [left, setLeft] = useState(holdSeconds);
  const over = left <= 0;
  const endedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (over || endedRef.current) return;
    if (!started || paused) return;

    intervalRef.current = setInterval(() => {
      setLeft((prev) => {
        const nextLeft = prev - 0.25;
        if (nextLeft <= 0) {
          if (!endedRef.current) {
            endedRef.current = true;
            onEnd?.();
          }
          return 0;
        }
        return nextLeft;
      });
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, paused, over, onEnd]);

  const toggle = () => {
    setStarted(true);
    setPaused((p) => !p);
  };

  const timerSize = 120;

  return (
    <View className="border-border bg-background px-gutter gap-3 border-t-[1.5px] pt-3 pb-4">
      <View className="flex-row items-baseline justify-center gap-2">
        <Eyebrow tone={over || !started ? 'primary' : 'muted'}>
          {over ? 'готово' : !started ? 'жми старт' : paused ? 'пауза' : 'держи'}
        </Eyebrow>
        {side && (
          <Lead size="sm" tone="primary">
            {side === 1 ? 'правая сторона' : 'левая сторона'}
          </Lead>
        )}
      </View>
      <View className="flex-row items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onPress={back.onPress}
          className="h-14 flex-col gap-0.5 px-3"
          contentClassName="flex-col gap-0.5"
        >
          <Icon as={back.icon} strokeWidth={2.5} className="size-5" />
          <Eyebrow>{back.label}</Eyebrow>
        </Button>

        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={paused ? 'Старт' : 'Пауза'}>
          <View className="relative items-center justify-center">
            <Ring value={over ? 1 : Math.min(1, Math.max(0, left / holdSeconds))} size={timerSize} stroke={8} />
            <View className="absolute">
              {over ? (
                <Poster size="xl" numeric>
                  00
                </Poster>
              ) : (
                <View className="items-center">
                  <Icon as={paused ? Play : Pause} strokeWidth={2.5} className="size-6" />
                  <Poster size="sm" numeric>
                    {formatSeconds(Math.ceil(left))}
                  </Poster>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        <Button
          variant={over ? 'default' : 'outline'}
          size="sm"
          onPress={next.onPress}
          className="h-14 flex-col gap-0.5 px-3"
          contentClassName="flex-col gap-0.5"
        >
          <Icon as={next.icon} strokeWidth={2.5} className="size-5" />
          <Eyebrow>{next.label}</Eyebrow>
        </Button>
      </View>
    </View>
  );
};
