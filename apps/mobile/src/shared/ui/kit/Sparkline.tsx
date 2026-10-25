import Svg, { Polyline } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { cn } from '@/shared/lib/utils';

type SparklineProps = {
  values: number[];
  /** Размер и цвет классами: text-primary → цвет линии */
  className?: string;
};

type LineProps = { values: number[]; color?: string; width?: number; height?: number };

const W = 56;
const H = 20;

const Line = ({ values, color = 'currentColor', width = W, height = H }: LineProps) => {
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  // Ряд без изменений — по центру: прижатая к низу линия читается как спад
  const y = (v: number) => (range ? ((18 - ((v - min) / range) * 16) / 20) * height : height / 2);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${y(v)}`).join(' ');

  return (
    <Svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
};

// Цвет и размер из классов, как у Icon: text-primary → stroke, w-/h- → размер
const StyledLine = withUniwind(Line, {
  color: { fromClassName: 'className', styleProperty: 'color' },
  width: { fromClassName: 'className', styleProperty: 'width' },
  height: { fromClassName: 'className', styleProperty: 'height' },
});

// Мини-график в строку списка — порт shared/ui/kit/Sparkline.tsx: только форма ряда, без осей
export const Sparkline = ({ values, className }: SparklineProps) =>
  values.length < 2 ? null : <StyledLine values={values} className={cn('text-foreground h-5 w-14', className)} />;
