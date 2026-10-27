import type { ReactNode } from 'react';
import { Circle, Group, Path, Text, useFont } from '@shopify/react-native-skia';

import { fontSources } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { KETTLEBELL_HANDLE } from './paths';

// Гиря-талисман: корпус, ручка и фактура общие для всех сцен, лицо и реквизит сцена кладёт детьми.
// Координаты свои: центр корпуса в 0,0, низ корпуса на y=46 — сцена ставит гирю на пол через translate
export const Kettlebell = ({ children }: { children?: ReactNode }) => {
  const { colors: c, palette } = useTheme();
  const font = useFont(fontSources.Oswald_700Bold, 11);
  // Выдавленный вес зависит от палитры: синяя — 32 кг, розовая — 16 кг
  const weight = palette === 'rose' ? '16 кг' : '32 кг';
  const weightWidth = font?.measureText(weight).width ?? 0;
  return (
    <Group>
      <Path path={KETTLEBELL_HANDLE} color={c.blue} style="stroke" strokeWidth={14} strokeCap="round" />
      <Circle cx={0} cy={0} r={46} color={c.blue} />
      {/* Блик литого чугуна */}
      <Path
        path="M-36 -12 A38 38 0 0 1 -16 -36"
        color={c.paper}
        style="stroke"
        strokeWidth={5}
        strokeCap="round"
        opacity={0.45}
      />
      <Circle cx={-10} cy={-39} r={2.5} color={c.paper} opacity={0.45} />
      {font && <Text x={-weightWidth / 2} y={26} text={weight} font={font} color={c.ink} opacity={0.3} />}
      {children}
    </Group>
  );
};
