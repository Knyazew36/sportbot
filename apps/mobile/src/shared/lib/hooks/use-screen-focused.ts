import { useIsFocused } from 'expo-router';

/**
 * Экран сейчас на виду. Вне дерева маршрутов (портал шторки) фокуса нет — считаем видимым.
 * try не нарушает порядок хуков: контекст читается всегда, бросает только проверка после
 */
export const useScreenFocused = (): boolean => {
  try {
    return useIsFocused();
  } catch {
    return true;
  }
};
