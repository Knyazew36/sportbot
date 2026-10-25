// Статические начертания шрифтов (variable-шрифты в RN работают плохо).
// Загружаются в корневом _layout через expo-font, до скрытия сплэша.
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
};

export type FontName = keyof typeof fonts;
