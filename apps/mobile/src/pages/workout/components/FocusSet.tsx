import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Pause, Play, TimerReset, X } from 'lucide-react-native';

import { type Measure, rangeText } from '@sportbot/api/lib/measure';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch';
import { cn } from '@/shared/lib/utils';
import { haptic } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Clock, Poster, Text } from '@/shared/ui/kit/Typography';
import { Ring } from '@/shared/ui/kit/Ring';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';

type FocusSetProps = {
  stopwatch: ReturnType<typeof useStopwatch>;
  title: string;
  startedAt: string;
  setNumber: number;
  plannedSets: number;
  /** Подход закончен — открыть ввод веса и повторов */
  onDone: () => void;
  /** Упражнение на время: план в секундах. Нижняя граница — сигнал «цель есть» */
  target?: { min: number; max: number; measure: Measure };
  /** Сигнал, когда время дошло до нижней границы цели: звук и вибрация из настроек */
  onTarget?: () => void;
};

// Идёт подход: секундомер на весь экран. Пауза — если отвлекли посреди подхода, её время в подход не идёт
export const FocusSet = ({ stopwatch, title, startedAt, setNumber, plannedSets, onDone, target, onTarget }: FocusSetProps) => {
  const sizes = useFocusSizes();
  // Сигнал один раз за подход: «Сначала» обнуляет секундомер — сигнал снова ждёт цели
  const signalled = useRef(false);
  const reached = !!target && stopwatch.elapsed >= target.min;
  useEffect(() => {
    if (!target) return;
    if (!reached) {
      signalled.current = false;
      return;
    }
    if (signalled.current) return;
    signalled.current = true;
    onTarget?.();
  }, [reached, target, onTarget]);

  const ring = sizes.pauseButton;
  // Кнопка паузы внутри кольца с отступом 14% от стороны — inset-[14%] фронта
  const inset = Math.round(ring * 0.14);
  const paused = stopwatch.paused;

  return (
    <FocusShell
      title={title}
      startedAt={startedAt}
      status={paused ? 'пауза — время подхода стоит' : undefined}
      alert={paused}
      sets={{ number: setNumber, done: setNumber - 1, planned: plannedSets }}
      dim={paused}
      actions={
        <>
          <Button variant="success" size="xl" block className="h-24" onPress={onDone}>
            <Icon as={Check} className="size-8" strokeWidth={3} />
            Закончил подход
          </Button>
          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={stopwatch.start}>
              <Icon as={TimerReset} className="size-5" />
              Сначала
            </Button>
            {/* Запустил по ошибке — выйти, ничего не записывая */}
            <Button variant="outline" className="flex-1" onPress={stopwatch.stop}>
              <Icon as={X} className="size-5" />
              Отменить
            </Button>
          </View>
        </>
      }
    >
      <Clock fontSize={sizes.setClock} style={sizes.setClockStyle} className={cn(paused && 'opacity-10')}>
        {formatSeconds(stopwatch.elapsed)}
      </Clock>
      {target && (
        <Text size="sm" tone={reached ? 'primary' : 'muted'} className={cn(paused && 'opacity-10')}>
          {reached ? 'цель есть' : 'цель'} · {rangeText(target.measure, target.min, target.max)}
        </Text>
      )}
      {/* Кольцо делает оборот за минуту — как секундная стрелка; в центре пауза, палец и взгляд в одной точке */}
      <View style={{ width: ring, height: ring }}>
        <Ring
          // Новая минута — новое кольцо: иначе переход с почти полного на пустое крутил бы его назад
          key={Math.floor(stopwatch.elapsedMs / 60_000)}
          value={(stopwatch.elapsedMs % 60_000) / 60_000}
          size={ring}
          stroke={5}
          transitionMs={250}
        />
        <Pressable
          onPress={() => {
            haptic.tap();
            if (paused) stopwatch.resume();
            else stopwatch.pause();
          }}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Продолжить подход' : 'Поставить подход на паузу'}
          style={{ position: 'absolute', top: inset, left: inset, right: inset, bottom: inset }}
          className={cn('items-center justify-center rounded-full active:scale-95', paused ? 'bg-primary' : 'bg-foreground')}
        >
          {/* Цвет явно: в RN он не наследуется от круга, и подпись выходила цвета самого круга */}
          <Icon
            as={paused ? Play : Pause}
            className={cn('size-7', paused ? 'text-primary-foreground' : 'text-background')}
            fill="currentColor"
          />
          <Poster size="xs" className={cn('mt-1.5', paused ? 'text-primary-foreground' : 'text-background')}>
            {paused ? 'дальше' : 'пауза'}
          </Poster>
        </Pressable>
      </View>
    </FocusShell>
  );
};
