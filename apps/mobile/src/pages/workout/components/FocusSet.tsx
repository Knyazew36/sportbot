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
import { Digits, Poster, Text } from '@/shared/ui/kit/Typography';
import { Ring } from '@/shared/ui/kit/Ring';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';

type FocusSetProps = {
  stopwatch: ReturnType<typeof useStopwatch>;
  title: string;
  startedAt: string;
  setNumber: number;
  plannedSets: number;
  onDone: () => void;
  target?: { min: number; max: number; measure: Measure };
  onTarget?: () => void;
};

export const FocusSet = ({ stopwatch, title, startedAt, setNumber, plannedSets, onDone, target, onTarget }: FocusSetProps) => {
  const sizes = useFocusSizes();
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

  return (
    <FocusShell
      title={title}
      startedAt={startedAt}
      status={stopwatch.paused ? 'пауза — время подхода стоит' : undefined}
      alert={stopwatch.paused}
      sets={{ number: setNumber, done: setNumber - 1, planned: plannedSets }}
      actions={
        <>
          <Button variant="success" size="xl" block className="h-24" onPress={onDone}>
            <Icon as={Check} className="size-8" strokeWidth={3} />
            Закончил подход
          </Button>
          <View className="flex-row gap-3">
            <Button variant="outline" block onPress={stopwatch.start}>
              <Icon as={TimerReset} className="size-5" />
              Сначала
            </Button>
            <Button variant="outline" block onPress={stopwatch.stop}>
              <Icon as={X} className="size-5" />
              Отменить
            </Button>
          </View>
        </>
      }
    >
      <Poster size="hero" numeric style={sizes.setClockStyle} className={cn(stopwatch.paused && 'opacity-50')}>
        <Digits fontSize={sizes.setClock}>{formatSeconds(stopwatch.elapsed)}</Digits>
      </Poster>
      {target && (
        <Text size="sm" tone={reached ? 'primary' : 'muted'}>
          {reached ? 'цель есть' : 'цель'} · {rangeText(target.measure, target.min, target.max)}
        </Text>
      )}
      <View
        className={cn(
          'bg-background/85 absolute inset-0 z-10',
          stopwatch.paused ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        pointerEvents={stopwatch.paused ? 'auto' : 'none'}
      />
      <View className="relative z-20">
        <Ring
          key={Math.floor(stopwatch.elapsedMs / 60_000)}
          value={(stopwatch.elapsedMs % 60_000) / 60_000}
          size={sizes.pauseButton}
          stroke={5}
        />
        <Pressable
          onPress={() => {
            haptic.tap();
            if (stopwatch.paused) stopwatch.resume();
            else stopwatch.pause();
          }}
          accessibilityLabel={stopwatch.paused ? 'Продолжить подход' : 'Поставить подход на паузу'}
          className={cn(
            'absolute inset-[14%] flex flex-col items-center justify-center rounded-full',
            stopwatch.paused ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
          )}
        >
          <Icon as={stopwatch.paused ? Play : Pause} className="size-7" fill="currentColor" />
          <Poster size="xs" tone="inherit" className="mt-1.5">
            {stopwatch.paused ? 'дальше' : 'пауза'}
          </Poster>
        </Pressable>
      </View>
    </FocusShell>
  );
};
