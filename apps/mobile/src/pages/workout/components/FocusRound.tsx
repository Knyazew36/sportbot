import { Pressable, View } from 'react-native';
import { Check, Pause, Play, TimerReset, X } from 'lucide-react-native';

import { type SupersetRound, supersetLabels } from '@sportbot/api/entities/workout';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch';
import { cn } from '@/shared/lib/utils';
import { haptic } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Digits, Poster, Text } from '@/shared/ui/kit/Typography';
import { isTimed, type Measure, rangeText } from '@sportbot/api/lib/measure';

import { FocusShell } from './FocusShell';

const repsText = (min: number, max: number, measure: Measure) =>
  isTimed(measure) ? rangeText(measure, min, max) : `${rangeText('REPS', min, max)} повт.`;

type FocusRoundProps = {
  stopwatch: ReturnType<typeof useStopwatch>;
  round: SupersetRound;
  startedAt: string;
  burstKey?: number;
  onFinish: () => void;
  onRestart: () => void;
  onCancel: () => void;
};

export const FocusRound = ({ stopwatch, round, startedAt, burstKey, onFinish, onRestart, onCancel }: FocusRoundProps) => {
  const labels = supersetLabels(round.members);
  const label = (id: number) => labels[round.members.findIndex((e) => e.id === id)]!;

  const togglePause = () => {
    haptic.tap();
    if (stopwatch.paused) stopwatch.resume();
    else stopwatch.pause();
  };

  return (
    <FocusShell
      running={!stopwatch.paused}
      startedAt={startedAt}
      sets={{ number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }}
      actions={
        <>
          <Button variant="success" size="xl" block onPress={onFinish}>
            <Icon as={Check} className="size-7" strokeWidth={3} />
            Закончил круг
          </Button>
          <View className="flex-row gap-3">
            <Button variant={stopwatch.paused ? 'default' : 'outline'} block onPress={togglePause}>
              <Icon as={stopwatch.paused ? Play : Pause} className="size-5" fill="currentColor" />
              {stopwatch.paused ? 'Дальше' : 'Пауза'}
            </Button>
            <Button variant="outline" block onPress={onRestart}>
              <Icon as={TimerReset} className="size-5" />
              Сначала
            </Button>
            <Button variant="outline" block onPress={onCancel}>
              <Icon as={X} className="size-5" />
              Отмена
            </Button>
          </View>
        </>
      }
    >
      <Poster size="hero" numeric className={cn('text-[min(110px,26vw)]', stopwatch.paused && 'opacity-50')}>
        <Digits fontSize={128}>{formatSeconds(stopwatch.elapsed)}</Digits>
      </Poster>
      <View
        className={cn(
          'bg-background/85 absolute inset-0 z-10',
          stopwatch.paused ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        pointerEvents={stopwatch.paused ? 'auto' : 'none'}
      />
      {stopwatch.paused && (
        <View className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Pressable
            onPress={togglePause}
            accessibilityLabel="Продолжить круг"
            className="bg-primary text-primary-foreground pointer-events-auto flex size-[min(140px,20svh)] flex-col items-center justify-center rounded-full"
          >
            <Icon as={Play} className="size-7" fill="currentColor" />
            <Poster size="xs" tone="inherit" className="mt-1.5">
              дальше
            </Poster>
          </Pressable>
        </View>
      )}
      <View key={burstKey} className="border-border w-full divide-y-[1.5px] border-[1.5px]">
        {round.round.map((e) => (
          <View key={e.id} className="flex-row items-center gap-3 px-3 py-2.5">
            <Poster size="xs" tone="primary" className="w-7 shrink-0">
              {label(e.id)}
            </Poster>
            <Text size="md" className="min-w-0 flex-1" numberOfLines={1}>
              {e.name}
            </Text>
            <Poster size="xs" numeric className="shrink-0">
              {repsText(e.repsMin, e.repsMax, e.measure)}
            </Poster>
          </View>
        ))}
      </View>
    </FocusShell>
  );
};
