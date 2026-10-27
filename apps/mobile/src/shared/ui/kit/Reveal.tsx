import type { ReactNode } from 'react';
import { View } from 'react-native';

type RiseProps = {
  children?: ReactNode;
  className?: string;
  /** Порядок блока на экране — раньше задавал лесенку входа, оставлен ради совместимости */
  index?: number;
};

// Анимацию входа снизу убрали: обёртка оставлена, чтобы не трогать раскладку экранов
export const Rise = ({ children, className }: RiseProps) => <View className={className}>{children}</View>;
