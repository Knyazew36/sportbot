import { useEffect, useId, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Path, Pattern, Text as SvgText } from 'react-native-svg';
import { Pointer } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { fonts } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Icon } from './Icon';
import { Eyebrow, Poster } from './Typography';

type Point = {
  /** Подпись на оси: «21 окт.» */
  label: string;
  /** Подпись выбранной точки, если нужна длиннее оси: «21 октября». По умолчанию — label */
  title?: string;
  value: number;
};

const defaultFormat = (v: number) => v.toString().replace('.', ',');

// Больше подписей на узком экране (от 375px) не помещается: даты наезжают друг на друга
const MAX_TICKS = 5;

// На длинном ряду точки сливаются в сплошную полосу и только мешают линии
const MAX_DOTS = 40;

const HEIGHT = 190;
// Поля как у AreaChart фронта: сверху 12, по бокам 8 и ещё 6 отступа оси; снизу — строка дат
const PAD = { top: 12, side: 14, axis: 22 };
const GRID_LINES = 4;

// Какие даты подписать: первая и последняя всегда, между ними — равномерно, не больше MAX_TICKS
const tickIndexes = (count: number) => {
  if (count <= MAX_TICKS) return new Set(Array.from({ length: count }, (_, i) => i));
  return new Set(Array.from({ length: MAX_TICKS }, (_, i) => Math.round((i * (count - 1)) / (MAX_TICKS - 1))));
};

type XY = [number, number];

// Ступенька с переходом посередине между точками — type="step" у recharts (d3 curveStep)
const stepPath = (pts: XY[]) =>
  pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const mid = (pts[i - 1]![0] + x) / 2;
      return `H${mid}V${y}H${x}`;
    })
    .join('');

// Плавная кривая без перелётов выше и ниже точек — type="monotone" у recharts (d3 curveMonotoneX)
const monotonePath = (pts: XY[]) => {
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('');
  const n = pts.length;
  const slope = (a: XY, b: XY) => (b[1] - a[1]) / (b[0] - a[0] || 1);
  const d = pts.slice(0, -1).map((p, i) => slope(p, pts[i + 1]!));
  const m = pts.map((p, i) => {
    if (i === 0) return d[0]!;
    if (i === n - 1) return d[n - 2]!;
    const h0 = p[0] - pts[i - 1]![0];
    const h1 = pts[i + 1]![0] - p[0];
    const s0 = d[i - 1]!;
    const s1 = d[i]!;
    const mid = (s0 * h1 + s1 * h0) / (h0 + h1 || 1);
    return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(mid));
  });
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = pts[i - 1]!;
      const h = (x - px) / 3;
      return `C${px + h},${py + m[i - 1]! * h} ${x - h},${y - m[i]! * h} ${x},${y}`;
    })
    .join('');
};

type StepChartProps = {
  data: Point[];
  unit: string;
  /** Как писать значение: для времени — «1:51», а не «111» */
  format?: (value: number) => string;
  /** Ступенька — рабочий вес держится до следующего прироста; линия — для плавных рядов вроде веса тела */
  curve?: 'step' | 'line';
  className?: string;
};

// График прогресса — порт shared/ui/kit/StepChart.tsx: синяя линия и растровая заливка — печатная фактура плаката
// вместо градиента. Значение дня — строкой над графиком, а не всплывашкой: всплывашка у краёв уезжает за график.
// Пока день не выбран, строка показывает последний и подсказывает, что точки нажимаются. Палец ведёт по графику — день меняется
export const StepChart = ({ data, unit, format = defaultFormat, curve = 'step', className }: StepChartProps) => {
  const { colors } = useTheme();
  const still = useReducedMotion();
  const dots = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const last = data.length - 1;
  const index = picked != null && picked <= last ? picked : last;
  const point = data[index];
  const ticks = tickIndexes(data.length);

  // Проявление слева направо — animationDuration фронта
  const reveal = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) reveal.set(withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [reveal, still]);
  const clip = useAnimatedStyle(() => ({ width: `${reveal.value * 100}%` }));

  const values = data.map((p) => p.value);
  // Поля по значению как domain ['dataMin - 4', 'dataMax + 2']: линия не липнет к краям
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 2;
  const plotBottom = HEIGHT - PAD.axis;
  const left = PAD.side;
  const right = Math.max(left, width - PAD.side);
  const x = (i: number) => (last > 0 ? left + (i / last) * (right - left) : (left + right) / 2);
  const y = (v: number) => plotBottom - ((v - min) / (max - min || 1)) * (plotBottom - PAD.top);
  const pts: XY[] = data.map((p, i) => [x(i), y(p.value)]);
  const line = pts.length ? (curve === 'step' ? stepPath(pts) : monotonePath(pts)) : '';
  const area = pts.length ? `${line}L${pts[pts.length - 1]![0]},${plotBottom}L${pts[0]![0]},${plotBottom}Z` : '';

  const pick = (e: GestureResponderEvent) => {
    if (!data.length || right <= left) return;
    const raw = last > 0 ? ((e.nativeEvent.locationX - left) / (right - left)) * last : 0;
    const i = Math.min(last, Math.max(0, Math.round(raw)));
    if (i === picked) return;
    haptic.tap();
    setPicked(i);
  };

  return (
    <View className={cn('gap-2', className)}>
      <View className="min-h-11 flex-row items-end justify-between gap-3 px-2">
        {point ? (
          <View className="min-w-0 shrink">
            <Poster size="md" numeric>
              {`${format(point.value)}${unit ? ` ${unit}` : ''}`}
            </Poster>
            <Eyebrow numberOfLines={1}>
              {picked == null ? 'последняя · ' : ''}
              {point.title ?? point.label}
            </Eyebrow>
          </View>
        ) : null}
        {picked == null ? (
          <View className="shrink-0 flex-row items-center gap-1">
            <Icon as={Pointer} className="text-primary size-3.5" />
            <Eyebrow tone="primary">нажми на день</Eyebrow>
          </View>
        ) : null}
      </View>
      <View
        style={{ height: HEIGHT }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        // Касание и ведение пальцем выбирают день; вертикальную прокрутку экрана график отдаёт сразу
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderTerminationRequest={() => true}
        accessibilityRole="adjustable"
        accessibilityLabel={point ? `${format(point.value)} ${unit}, ${point.title ?? point.label}` : undefined}
      >
        {width > 0 && (
          <Svg width={width} height={HEIGHT} pointerEvents="none">
            {Array.from({ length: GRID_LINES }, (_, i) => {
              const gy = PAD.top + (i / (GRID_LINES - 1)) * (plotBottom - PAD.top);
              return <Line key={i} x1={0} x2={width} y1={gy} y2={gy} stroke={colors.rule} strokeWidth={1} />;
            })}
            {/* Подпись даты у первой и последней точки прижата внутрь: по центру её срезал бы край */}
            {data.map((p, i) =>
              ticks.has(i) ? (
                <SvgText
                  key={i}
                  x={x(i)}
                  y={HEIGHT - 6}
                  fontSize={11}
                  fontFamily={fonts.sans}
                  textAnchor={i === 0 && last > 0 ? 'start' : i === last && last > 0 ? 'end' : 'middle'}
                  fill={colors.ink}
                  fillOpacity={0.55}
                >
                  {p.label}
                </SvgText>
              ) : null,
            )}
          </Svg>
        )}
        {width > 0 && (
          <Animated.View pointerEvents="none" className="absolute inset-y-0 left-0 overflow-hidden" style={clip}>
            <Svg width={width} height={HEIGHT}>
              <Defs>
                <Pattern id={dots} width={6} height={6} patternUnits="userSpaceOnUse">
                  <Circle cx={3} cy={3} r={1.2} fill={colors.blue} opacity={0.45} />
                </Pattern>
              </Defs>
              <Path d={area} fill={`url(#${dots})`} />
              <Path d={line} fill="none" stroke={colors.blue} strokeWidth={2} />
              {data.length <= MAX_DOTS &&
                pts.map(([px, py], i) => (
                  <Circle key={i} cx={px} cy={py} r={3} fill={colors.blue} stroke={colors.paper} strokeWidth={1.5} />
                ))}
            </Svg>
          </Animated.View>
        )}
        {width > 0 && point && (
          <Svg width={width} height={HEIGHT} pointerEvents="none" style={{ position: 'absolute' }}>
            <Line
              x1={x(index)}
              x2={x(index)}
              y1={PAD.top}
              y2={plotBottom}
              stroke={colors.ink}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Circle cx={x(index)} cy={y(point.value)} r={6} fill={colors.blue} stroke={colors.paper} strokeWidth={2} />
          </Svg>
        )}
      </View>
    </View>
  );
};
