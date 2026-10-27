import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

// Фоновые узоры вместо CSS-утилит фронта (sb-lanes, hatch, sb-halftone): в RN нет repeating-linear-gradient.
// Растягиваются на родителя, нажатия не перехватывают

// useId в React 19 даёт «»-символы — в url(#…) react-native-svg их не переварит
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');

type PatternProps = { color: string; opacity?: number };

const LANE_STEP = 14;

/**
 * Беговые дорожки: вертикальные линии через 14 — подложка чёрных плашек (InkPanel).
 * Обычные View, а не SVG Pattern: узор с userSpaceOnUse на устройстве не рисовался вовсе
 */
export const Lanes = ({ color, opacity = 1 }: PatternProps) => {
  const [width, setWidth] = useState(0);
  const count = Math.ceil(width / LANE_STEP);
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{ position: 'absolute', top: 0, bottom: 0, left: i * LANE_STEP, width: 1.5, backgroundColor: color }}
        />
      ))}
    </View>
  );
};

/** Диагональная штриховка: корешок подсказки, пауза */
export const Hatch = ({ color, opacity = 1 }: PatternProps) => {
  const id = useSvgId();
  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Defs>
        <Pattern id={id} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1={0} y1={0} x2={0} y2={7} stroke={color} strokeWidth={1.5} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
};

/** Растр точками: заглушка картинки справочника */
export const Halftone = ({ color, opacity = 1 }: PatternProps) => {
  const id = useSvgId();
  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Defs>
        <Pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.4} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
};

/**
 * Растр кольцом — sb-halftone с радиальной маской из меню фронта: в центре пусто,
 * точки проступают к середине радиуса и гаснут к краю
 */
export const HalftoneRing = ({ color, opacity = 1 }: PatternProps) => {
  const id = useSvgId();
  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Defs>
        <Pattern id={`${id}p`} width={7} height={7} patternUnits="userSpaceOnUse">
          <Circle cx={3.5} cy={3.5} r={1.15} fill={color} />
        </Pattern>
        <RadialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <Stop offset="0.42" stopColor="#fff" stopOpacity={0} />
          <Stop offset="0.62" stopColor="#fff" stopOpacity={1} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id={`${id}m`}>
          <Rect width="100%" height="100%" fill={`url(#${id}g)`} />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}p)`} mask={`url(#${id}m)`} />
    </Svg>
  );
};
