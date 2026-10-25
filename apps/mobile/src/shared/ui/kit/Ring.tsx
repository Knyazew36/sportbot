import { useTheme } from '@/shared/theme/ThemeProvider';
import Svg, { Circle } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';

type RingProps = {
  value: number;
  size: number;
  stroke?: number;
  className?: string;
};

// Кольцо прогресса: value от 0 до 1, track — класс цвета дорожки
export const Ring = ({ value, size, stroke = 6, className }: RingProps) => {
  const { colors } = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));

  return (
    <Svg width={size} height={size} className={cn('-rotate-90', className)}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={colors.ink}
        opacity={0.14}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={colors.blue}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="butt"
      />
    </Svg>
  );
};
