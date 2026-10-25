import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Check, Pause, Play, TimerReset, X } from 'lucide-react-native';

import { type SupersetRound, supersetLabels } from '@sportbot/api/entities/workout';
import { isTimed, type Measure, rangeText } from '@sportbot/api/lib/measure';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch';
import { cn } from '@/shared/lib/utils';
import { haptic } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Clock, Poster, Text } from '@/shared/ui/kit/Typography';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';

type FocusRoundProps = {
  stopwatch: ReturnType<typeof useStopwatch>;
  round: SupersetRound;
  startedAt: string;
  /** Меняется в момент «Закончил круг» — список круга вспыхивает */
  burstKey?: number;
  onFinish: () => void;
  onRestart: () => void;
  onCancel: () => void;
};

// План строки круга: «8–12 повт.»; у упражнения на время — «30–60 с»
const repsText = (min: number, max: number, measure: Measure) =>
  isTimed(measure) ? rangeText(measure, min, max) : `${rangeText('REPS', min, max)} повт.`;

// Круг суперсета на весь экран: упражнения идут подряд без телефона в руках, поэтому круг виден целиком,
// а нажатие одно — в конце. Ввод — одной шторкой после круга
export const FocusRound = ({ stopwatch, round, startedAt, burstKey, onFinish, onRestart, onCancel }: FocusRoundProps) => {
  const sizes = useFocusSizes();
  const still = useReducedMotion();
  const labels = supersetLabels(round.members);
  const label = (id: number) => labels[round.members.findIndex((e) => e.id === id)]!;
  const paused = stopwatch.paused;

  // Вспышка круга: короткий удар масштабом, без неё закрытие круга теряется. brightness в RN нет — только масштаб
  const scale = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (still || burstKey === undefined) return;
    scale.set(withSequence(withTiming(1.04, { duration: 0 }), withSpring(1, { stiffness: 420, damping: 18 })));
  }, [burstKey, scale, still]);
  const burst = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const togglePause = () => {
    haptic.tap();
    if (paused) stopwatch.resume();
    else stopwatch.pause();
  };

  return (
    <FocusShell
      running={!paused}
      startedAt={startedAt}
      sets={{ number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }}
      // На паузе гасим всё, кроме кнопки «дальше» посередине — как у обычного подхода
      dim={paused}
      overlay={
        paused && (
          <Animated.View entering={still ? FadeIn.duration(180) : ZoomIn.duration(180)} exiting={FadeOut.duration(180)}>
            <Pressable
              onPress={togglePause}
              accessibilityRole="button"
              accessibilityLabel="Продолжить круг"
              style={{ width: sizes.pauseButton, height: sizes.pauseButton }}
              className="bg-primary items-center justify-center rounded-full active:scale-95"
            >
              <Icon as={Play} className="text-primary-foreground size-7" fill="currentColor" />
              <Poster size="xs" className="text-primary-foreground mt-1.5">
                дальше
              </Poster>
            </Pressable>
          </Animated.View>
        )
      }
      actions={
        <>
          <Button variant="success" size="xl" block onPress={onFinish}>
            <Icon as={Check} className="size-7" strokeWidth={3} />
            Закончил круг
          </Button>
          <View className="flex-row gap-3">
            <Button
              variant={paused ? 'default' : 'outline'}
              className="flex-1"
              contentClassName="px-2"
              onPress={togglePause}
              accessibilityLabel={paused ? 'Продолжить круг' : 'Поставить круг на паузу'}
            >
              <Icon as={paused ? Play : Pause} className="size-5" fill="currentColor" />
              {paused ? 'Дальше' : 'Пауза'}
            </Button>
            <Button variant="outline" className="flex-1" contentClassName="px-2" onPress={onRestart}>
              <Icon as={TimerReset} className="size-5" />
              Сначала
            </Button>
            {/* Отмена сбрасывает весь круг: ввода ещё не было, записывать нечего */}
            <Button variant="outline" className="flex-1" contentClassName="px-2" onPress={onCancel}>
              <Icon as={X} className="size-5" />
              Отмена
            </Button>
          </View>
        </>
      }
    >
      <Clock fontSize={sizes.roundClock} style={sizes.roundClockStyle} className={cn(paused && 'opacity-50')}>
        {formatSeconds(stopwatch.elapsed)}
      </Clock>
      {/* Весь круг списком: взгляд на экран между упражнениями — и видно, что дальше и сколько повторов.
          Разделители — верхней рамкой строк: divide-* в Uniwind нет */}
      <Animated.View style={burst} className="border-border w-full border-[1.5px]">
        {round.round.map((e, i) => (
          <View
            key={e.id}
            className={cn('flex-row items-center gap-3 px-3 py-2.5', i > 0 && 'border-border border-t-[1.5px]')}
          >
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
      </Animated.View>
    </FocusShell>
  );
};
