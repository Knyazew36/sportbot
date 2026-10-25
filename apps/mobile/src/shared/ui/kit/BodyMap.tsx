import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { ANTERIOR, type BodyPolygon, type BodyZone, POSTERIOR } from './body-map-data';

export type BodySide = 'front' | 'back';

// Наши коды мышц → зоны фигуры. Средних дельт у фигуры нет: они подсвечивают передние и задние сразу
const ZONES: Record<string, BodyZone[]> = {
  traps: ['trapezius'],
  'front-delts': ['front-deltoids'],
  'mid-delts': ['front-deltoids', 'back-deltoids'],
  'rear-delts': ['back-deltoids'],
  chest: ['chest'],
  lats: ['upper-back'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs', 'obliques'],
  'lower-back': ['lower-back'],
  glutes: ['gluteal', 'abductors'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  adductors: ['adductor'],
  calves: ['calves', 'left-soleus', 'right-soleus'],
};

// Тап по зоне → наш код. Дельты спереди — передние, сзади — задние; голова, шея и колени не выбираются
const PICK: Partial<Record<BodyZone, string>> = {
  trapezius: 'traps',
  'front-deltoids': 'front-delts',
  'back-deltoids': 'rear-delts',
  chest: 'chest',
  'upper-back': 'lats',
  biceps: 'biceps',
  triceps: 'triceps',
  forearm: 'forearms',
  abs: 'abs',
  obliques: 'abs',
  'lower-back': 'lower-back',
  gluteal: 'glutes',
  abductors: 'glutes',
  quadriceps: 'quads',
  hamstring: 'hamstrings',
  adductor: 'adductors',
  calves: 'calves',
  'left-soleus': 'calves',
  'right-soleus': 'calves',
};

const zonesOf = (codes: readonly string[]) => new Set(codes.flatMap((c) => ZONES[c] ?? []));

// Тап мимо мышцы (в просвет, по колену) ищет ближайшую в этом радиусе — единицы viewBox, ширина фигуры 100
const REACH = 10;

type Point = [number, number];

const parse = (points: string): Point[] => {
  const n = points.trim().split(/\s+/).map(Number);
  const out: Point[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i]!, n[i + 1]!]);
  return out;
};

const inside = ([x, y]: Point, poly: Point[]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

const segmentDistance = ([px, py]: Point, [ax, ay]: Point, [bx, by]: Point) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const distance = (p: Point, poly: Point[]) =>
  poly.reduce((min, a, i) => Math.min(min, segmentDistance(p, a, poly[(i + 1) % poly.length]!)), Infinity);

// Полигоны разбираются один раз: тап проверяет их геометрией, а не событиями svg
const SHAPES = {
  front: ANTERIOR.flatMap((z) => z.points.map((points) => ({ muscle: z.muscle, points, poly: parse(points) }))),
  back: POSTERIOR.flatMap((z) => z.points.map((points) => ({ muscle: z.muscle, points, poly: parse(points) }))),
} satisfies Record<BodySide, (Pick<BodyPolygon, 'muscle'> & { points: string; poly: Point[] })[]>;

/** Код мышцы под точкой viewBox: точное попадание, иначе ближайшая выбираемая в радиусе REACH */
const codeAt = (side: BodySide, p: Point) => {
  const shapes = SHAPES[side].filter((s) => PICK[s.muscle]);
  const hit = shapes.find((s) => inside(p, s.poly));
  if (hit) return PICK[hit.muscle];
  const near = shapes
    .map((s) => ({ s, d: distance(p, s.poly) }))
    .filter((c) => c.d <= REACH)
    .sort((a, b) => a.d - b.d)[0];
  return near ? PICK[near.s.muscle] : undefined;
};

type BodyMapProps = {
  side: BodySide;
  /** Залиты сплошным: выбранные или основные */
  selected?: readonly string[];
  /** Залиты наполовину: помогающие мышцы в карточке упражнения */
  secondary?: readonly string[];
  /** Тап по зоне — код мышцы. Без него карта — просто картинка */
  onToggle?: (code: string) => void;
  className?: string;
};

// Карта тела в цветах плаката — порт shared/ui/kit/BodyMap.tsx на react-native-svg.
// Тело — светлый синий, выбранные мышцы — сплошной синий. Прозрачность синего поверх фона
// даёт те же оттенки, что color-mix во фронте
export const BodyMap = ({ side, selected = [], secondary = [], onToggle, className }: BodyMapProps) => {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const full = zonesOf(selected);
  const half = zonesOf(secondary.filter((c) => !selected.includes(c)));

  const figure = (
    <Svg width="100%" height="100%" viewBox="0 0 100 200">
      {SHAPES[side].map((s, i) => (
        <Polygon
          key={i}
          points={s.points}
          fill={colors.blue}
          fillOpacity={full.has(s.muscle) ? 1 : half.has(s.muscle) ? 0.45 : 0.14}
        />
      ))}
    </Svg>
  );

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={side === 'front' ? 'Тело спереди' : 'Тело сзади'}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={cn('aspect-[1/2]', className)}
    >
      {onToggle ? (
        <Pressable
          className="flex-1"
          onPress={(e) => {
            if (!width) return;
            const scale = 100 / width;
            const code = codeAt(side, [e.nativeEvent.locationX * scale, e.nativeEvent.locationY * scale]);
            if (!code) return;
            haptic.tap();
            onToggle(code);
          }}
        >
          {figure}
        </Pressable>
      ) : (
        figure
      )}
    </View>
  );
};
