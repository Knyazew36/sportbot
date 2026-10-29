import { StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import type { BlurTarget } from './screen-chrome';

type GlassProps = ViewProps & {
  /** Что размываем. Без цели на Android остаётся только полупрозрачная заливка */
  target?: BlurTarget | null;
  /** Заливка поверх размытия — как bg-background/85 у липких полос фронта */
  tone?: string;
  className?: string;
};

// Матовое стекло липких полос — порт backdrop-blur-glass фронта (--blur-glass: 14px).
// На Android радиус = intensity / blurReductionFactor (4), отсюда 56. Заливку кладём своим слоем:
// tint expo-blur своих цветов темы не знает
export const Glass = ({ target, tone = 'bg-background/85', children, ...props }: GlassProps) => {
  const { scheme } = useTheme();
  return (
    <View {...props}>
      <BlurView
        blurTarget={target ?? undefined}
        blurMethod={target ? 'dimezisBlurViewSdk31Plus' : 'none'}
        intensity={56}
        tint={scheme}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" className={cn('absolute inset-0', tone)} />
      {children}
    </View>
  );
};
