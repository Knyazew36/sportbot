import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Icon } from './Icon';
import { Hatch } from './Patterns';
import { Eyebrow, Poster, Text } from './Typography';
import { Pressable } from './Pressable';

type NoticeProps = {
  /** Метка над заголовком: что это за подсказка */
  kicker?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Компактное действие справа от текста — одна маленькая кнопка */
  action?: ReactNode;
  /** Действия на всю ширину под текстом — когда кнопок несколько или подпись длинная */
  children?: ReactNode;
  /** Весь блок — переход: шеврон справа вместо кнопки */
  onPress?: () => void;
  className?: string;
};

// Подсказка-напоминание — порт shared/ui/kit/Notice.tsx: пропущенная заминка, забытые мышцы, пауза.
// Штриховка — только корешок слева: текст на сплошной штриховке читался бы пятнами
export const Notice = ({ kicker, title, description, action, children, onPress, className }: NoticeProps) => {
  const { colors } = useTheme();
  const frame = cn('border-border bg-background flex-row border-[1.5px]', onPress && 'active:bg-mist', className);

  const body = (
    <>
      <View className="border-border w-3 overflow-hidden border-r-[1.5px]">
        <Hatch color={colors.hatch} />
      </View>
      <View className="min-w-0 flex-1 gap-4 p-4">
        <View className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1 gap-1.5">
            {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
            {title ? <Poster size="md">{title}</Poster> : null}
            {description ? (
              <Text size="sm" tone="soft">
                {description}
              </Text>
            ) : null}
          </View>
          {action}
          {onPress && <Icon as={ChevronRight} className="text-foreground/40 size-5" />}
        </View>
        {children}
      </View>
    </>
  );

  if (!onPress) return <View className={frame}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      className={frame}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      {body}
    </Pressable>
  );
};
