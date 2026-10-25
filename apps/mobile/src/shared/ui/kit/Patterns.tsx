import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

// Фоновые узоры вместо CSS-утилит фронта (sb-lanes, hatch, sb-halftone): в RN нет repeating-linear-gradient.
// Растягиваются на родителя, нажатия не перехватывают

// useId в React 19 даёт «»-символы — в url(#…) react-native-svg их не переварит
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');

type PatternProps = { color: string; opacity?: number };

/** Беговые дорожки: вертикальные линии через 14 — подложка чёрных плашек (InkPanel) */
export const Lanes = ({ color, opacity = 1 }: PatternProps) => {
  const id = useSvgId();
  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Defs>
        <Pattern id={id} width={14} height={14} patternUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={1.5} height={14} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
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
