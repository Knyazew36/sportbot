// Статические начертания шрифтов (variable-шрифты в RN работают плохо).
// Загружаются в корневом _layout через expo-font, до скрытия сплэша.
import {
  Cormorant_300Light_Italic,
  Cormorant_400Regular_Italic,
} from '@expo-google-fonts/cormorant';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Onest_400Regular, Onest_500Medium } from '@expo-google-fonts/onest';
import { Oswald_500Medium, Oswald_700Bold } from '@expo-google-fonts/oswald';

// Источники для useFonts: ключи — имена, которыми шрифты доступны в fontFamily
export const fontSources = {
  Onest_400Regular,
  Onest_500Medium,
  Oswald_700Bold,
  Oswald_500Medium,
  JetBrainsMono_400Regular,
  Cormorant_300Light_Italic,
  Cormorant_400Regular_Italic,
};

export const fonts = {
  // Основной гротеск
  sans: 'Onest_400Regular',
  sansMedium: 'Onest_500Medium',
  // Плакатный кондензированный: заголовки и цифры
  display: 'Oswald_700Bold',
  displayMedium: 'Oswald_500Medium',
  // Моно-метки
  mono: 'JetBrainsMono_400Regular',
  // Волосяная антиква-курсив: вводные строки
  serif: 'Cormorant_300Light_Italic',
  serifRegular: 'Cormorant_400Regular_Italic',
} as const;

export type FontName = keyof typeof fonts;
