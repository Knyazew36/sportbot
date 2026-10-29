import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Canvas, Group } from '@shopify/react-native-skia';

import { cn } from '@/shared/lib/utils';
import { ThemeBridge, useTheme } from '@/shared/theme/ThemeProvider';

type ArtCanvasProps = { width: number; height: number; className?: string; children?: ReactNode };

// Аналог <Svg viewBox>: холст тянется по ширине обёртки с пропорцией сцены, координаты внутри — как в viewBox.
// Масштаб считается на UI-потоке из размера холста, без setState и лишнего рендера
export const ArtCanvas = ({ width, height, className, children }: ArtCanvasProps) => {
  const size = useSharedValue({ width: 0, height: 0 });
  const transform = useDerivedValue(() => [{ scale: size.value.width / width }]);
  const theme = useTheme();
  return (
    <View className={cn('w-full', className)}>
      <Canvas onSize={size} style={{ width: '100%', aspectRatio: width / height }}>
        <ThemeBridge value={theme}>
          <Group transform={transform}>{children}</Group>
        </ThemeBridge>
      </Canvas>
    </View>
  );
};
