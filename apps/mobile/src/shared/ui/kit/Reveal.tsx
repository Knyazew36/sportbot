import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

// Animated.View из Reanimated — не компонент react-native: className ему передаём через withUniwind
const AnimatedView = withUniwind(Animated.View);

type RiseProps = {
  children?: ReactNode;
  className?: string;
  /** Порядок блока на экране — для лесенки входа */
  index?: number;
};

// Вход блока снизу с проявлением — порт Rise из shared/ui/kit/Reveal.tsx (motion → Reanimated).
// Лесенку Stagger заменяет задержка по index: в RN нет оркестровки детей
export const Rise = ({ children, className, index = 0 }: RiseProps) => (
  <AnimatedView
    entering={FadeInDown.springify().damping(30).stiffness(260).delay(50 + index * 70)}
    className={className}
  >
    {children}
  </AnimatedView>
);
