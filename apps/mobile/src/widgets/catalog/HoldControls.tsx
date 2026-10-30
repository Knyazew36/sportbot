import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Play, Pause } from 'lucide-react-native';

import { formatSeconds, useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Ring } from '@/shared/ui/kit/Ring';
import { Eyebrow, Clock, Lead } from '@/shared/ui/kit/Typography';
import { Pressable } from '@/shared/ui/kit/Pressable';

type SideAction = { label: string; icon: LucideIcon; onPress: () => void; disabled?: boolean };

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
  // Отсчёт от отметки времени: на паузе кольцо замирает ровно там, где стояло
  const timer = useDeadlineTimer({ onEnd });
  const started = timer.status !== 'idle';
  const paused = timer.status !== 'running';
  const over = timer.status === 'running' && timer.left <= 0;

  // «Попробовать» в карточке растяжки: человек уже нажал старт
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    timer.start(holdSeconds);
  }, [autoStart, holdSeconds, timer]);

  const toggle = () => {
    if (timer.status === 'idle') timer.start(holdSeconds);
    else if (timer.status === 'running') timer.pause();
    else timer.resume();
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
          disabled={back.disabled}
          contentClassName="h-14 flex-col gap-0.5 px-3"
        >
          <Icon as={back.icon} strokeWidth={2.5} className="size-5" />
          <Eyebrow>{back.label}</Eyebrow>
        </Button>

        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={paused ? 'Старт' : 'Пауза'}>
          <View className="relative items-center justify-center">
            <Ring
              value={over || !started ? 1 : timer.fraction}
              sweep={over ? undefined : timer.sweep}
              size={timerSize}
              stroke={8}
            />
            <View className="absolute">
              {over ? (
                <Clock size="xl">00</Clock>
              ) : (
                <View className="items-center">
                  <Icon as={paused ? Play : Pause} strokeWidth={2.5} className="size-6" />
                  <Clock size="sm">{formatSeconds(started ? timer.left : holdSeconds)}</Clock>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        <Button
          variant={over ? 'default' : 'outline'}
          size="sm"
          onPress={next.onPress}
          contentClassName="h-14 flex-col gap-0.5 px-3"
        >
          <Icon as={next.icon} strokeWidth={2.5} className="size-5" />
          <Eyebrow>{next.label}</Eyebrow>
        </Button>
      </View>
    </View>
  );
};
