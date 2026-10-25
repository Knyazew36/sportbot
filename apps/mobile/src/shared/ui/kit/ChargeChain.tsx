import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Poster } from './Typography';
import { Pressable } from './Pressable';

export type ChargeLink = {
  label: string;
  /** Заряд звена 0..1: доля сделанных подходов или пройденный шаг круга */
  charge: number;
  state: 'done' | 'current' | 'idle';
};

type ChargeChainProps = {
  links: ChargeLink[];
  /** Тап по звену: пагинация ленты карточек */
  onPick?: (index: number) => void;
  /** Меняется — цепочка вспыхивает и звенья защёлкиваются: круг закрыт */
  burstKey?: string | number;
  className?: string;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));

// Цепочка суперсета — порт shared/ui/kit/ChargeChain.tsx: звенья заряжаются синим по ходу круга,
// заряд перетекает в следующее звено. Одна и та же на экране суперсета, в фокусе круга и на отдыхе
export const ChargeChain = ({ links, onPick, burstKey, className }: ChargeChainProps) => {
  const still = useReducedMotion();
  const scale = useSharedValue(1);
  const mounted = useRef(false);

  // Вспышка круга: короткий удар масштабом, без него закрытие круга теряется. brightness в RN нет — только масштаб
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (still || burstKey === undefined) return;
    scale.set(withSequence(withTiming(1.08, { duration: 0 }), withSpring(1, { stiffness: 420, damping: 18 })));
  }, [burstKey, scale, still]);

  const burst = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View className={cn('flex-row items-center', className)} style={burst}>
      {links.map((link, i) => (
        <View key={link.label} className="min-w-0 flex-1 flex-row items-center">
          {i > 0 && <Coupler charged={links[i - 1]!.state === 'done'} still={still} />}
          <ChainLink link={link} still={still} onPress={onPick ? () => onPick(i) : undefined} />
        </View>
      ))}
    </Animated.View>
  );
};

/** Сцепка между звеньями: заряжена, когда предыдущее звено пройдено */
const Coupler = ({ charged, still }: { charged: boolean; still: boolean }) => {
  const fill = useSharedValue(charged ? 1 : 0);

  useEffect(() => {
    const to = charged ? 1 : 0;
    fill.set(still ? to : withTiming(to, { duration: 250, easing: Easing.out(Easing.ease) }));
  }, [charged, fill, still]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));

  return (
    <View className="bg-foreground/15 h-[3px] w-3 shrink-0 overflow-hidden">
      <Animated.View className="bg-primary absolute inset-0" style={[{ transformOrigin: 'left' }, style]} />
    </View>
  );
};

type ChainLinkProps = { link: ChargeLink; still: boolean; onPress?: () => void };

const ChainLink = ({ link, still, onPress }: ChainLinkProps) => {
  const charge = useSharedValue(clamp(link.charge));
  const breath = useSharedValue(0.2);
  const current = link.state === 'current';

  useEffect(() => {
    const to = clamp(link.charge);
    charge.set(still ? to : withTiming(to, { duration: 450, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
  }, [charge, link.charge, still]);

  // Текущее звено «дышит», пока заряд не дошёл: видно, где сейчас круг
  useEffect(() => {
    if (!current || still) return;
    breath.set(withRepeat(withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [breath, current, still]);

  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: charge.value }] }));
  const pulse = useAnimatedStyle(() => ({ opacity: breath.value }));

  const body = (
    <View
      className={cn(
        // Пройденное звено узнаётся по полной заливке: галочка рядом с меткой не влезала в пять звеньев
        'h-8 min-w-0 flex-1 items-center justify-center overflow-hidden',
        current ? 'border-primary border-2' : 'border-foreground/25 border-[1.5px]',
      )}
    >
      <Animated.View className="bg-primary absolute inset-0" style={[{ transformOrigin: 'left' }, fill]} />
      {current && !still && <Animated.View className="bg-primary/25 absolute inset-0" style={pulse} />}
      {/* Светлая метка только на полностью залитом звене: на половинной заливке она терялась */}
      <Poster size="xs" className={link.charge >= 1 ? 'text-primary-foreground' : 'text-foreground'}>
        {link.label}
      </Poster>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      className="min-w-0 flex-1 flex-row"
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      {body}
    </Pressable>
  );
};
