import { useContext } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { withUniwind } from 'uniwind';

import { cn } from '@/shared/lib/utils';

import { TextClassContext } from './Typography';

type IconProps = LucideProps & { as: LucideIcon; className?: string };

const IconImpl = ({ as: IconComponent, ...props }: IconProps) => <IconComponent {...props} />;

// Размер и цвет иконки берутся из классов: size-5 → size, text-primary → color
const StyledIcon = withUniwind(IconImpl, {
  size: { fromClassName: 'className', styleProperty: 'width' },
  color: { fromClassName: 'className', styleProperty: 'color' },
});

/**
 * Иконка lucide с className — порт Icon из React Native Reusables (Uniwind).
 * Внутри кнопки или чёрной плашки цвет берётся из TextClassContext, как у текста
 */
export const Icon = ({ as, className, strokeWidth = 2, ...props }: IconProps) => {
  const textClass = useContext(TextClassContext);
  return (
    <StyledIcon as={as} strokeWidth={strokeWidth} className={cn('text-foreground size-5', textClass, className)} {...props} />
  );
};
