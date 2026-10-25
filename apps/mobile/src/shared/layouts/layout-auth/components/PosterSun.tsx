import { View } from 'react-native';

import { HalftoneRing } from '@/shared/ui/kit/Patterns';
import { useTheme } from '@/shared/theme/ThemeProvider';

// Растровое солнце в углу — тот же мотив, что в сценах Art: экран входа сразу узнаётся как плакат Спортбота.
// Вылезает за край намеренно — круг целиком выглядел бы наклейкой, а не частью листа
export const PosterSun = () => {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" className="absolute -top-24 -right-32 size-[360px]">
      <HalftoneRing color={colors.blue} opacity={0.55} />
      <View className="border-sb-blue/25 absolute inset-[70px] rounded-full border-[1.5px]" />
    </View>
  );
};
