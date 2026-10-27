import { useEffect } from 'react';
import { Easing, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import type { Transforms3d } from '@shopify/react-native-skia';

// Анимации сцен на Skia: такты reanimated идут прямо в свойства холста, без React и без перерисовки
// всей SVG-сцены на процессоре — из-за неё react-native-svg дёргал скролл

export const EASE_IN_OUT = Easing.inOut(Easing.ease);
export const EASE_OUT = Easing.out(Easing.ease);

// CSS-задержки во фронте отрицательные (старт с середины цикла) — reanimated ждёт только вперёд,
// поэтому фазу переносим на положительный сдвиг внутри периода (для alternate период — два прогона)
export const phaseDelayMs = (delaySec: number, periodSec: number) =>
  ((periodSec - (delaySec % periodSec)) % periodSec) * 1000;

type CycleOptions = { reverse?: boolean; delayMs?: number; ease?: (value: number) => number; paused?: boolean };

// Один бесконечный такт 0→1; reverse — CSS alternate «туда-обратно», paused — prefers-reduced-motion
export const useCycle = (
  durationMs: number,
  { reverse = false, delayMs = 0, ease = EASE_IN_OUT, paused = false }: CycleOptions = {},
) => {
  const t = useSharedValue(0);
  useEffect(() => {
    if (paused) return;
    t.set(withDelay(delayMs, withRepeat(withTiming(1, { duration: durationMs, easing: ease }), -1, reverse)));
  }, [t, durationMs, reverse, delayMs, ease, paused]);
  return t;
};

export const IDENTITY: Transforms3d = [{ scale: 1 }];

export const deg = (value: number) => {
  'worklet';
  return (value * Math.PI) / 180;
};

// SVG «op(… cx cy)» — та же операция вокруг точки: сдвиг в точку, операция, сдвиг обратно
export const around = (x: number, y: number, steps: Transforms3d): Transforms3d => {
  'worklet';
  return [{ translateX: x }, { translateY: y }, ...steps, { translateX: -x }, { translateY: -y }];
};
