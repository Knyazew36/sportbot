import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Lanes } from './Patterns';
import { TextClassContext } from './Typography';

type InkPanelProps = {
  children: ReactNode;
  /** Жёсткая синяя тень у плашки — та же «нажимаемость», но в масштабе блока (shadow-[6px_6px_0_var(--sb-blue)]) */
  shadow?: boolean;
  className?: string;
};

// Чёрная плашка с разметкой беговых дорожек — порт shared/ui/kit/InkPanel.tsx: главный акцент экрана.
// Текст внутри по умолчанию светлый — как text-background у плашки во фронте
export const InkPanel = ({ children, shadow, className }: InkPanelProps) => {
  const { colors } = useTheme();
  return (
    <View className={cn(shadow && 'mr-1.5 mb-1.5')}>
      {shadow && <View className="bg-sb-blue absolute inset-0 translate-x-1.5 translate-y-1.5" />}
      <TextClassContext.Provider value="text-background">
        <View className={cn('bg-foreground overflow-hidden', className)}>
          <Lanes color={colors.blue} opacity={0.13} />
          {children}
        </View>
      </TextClassContext.Provider>
    </View>
  );
};
