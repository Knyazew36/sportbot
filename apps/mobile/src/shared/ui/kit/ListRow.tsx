import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { Poster, Text } from './Typography';
import { Pressable } from './Pressable';

export const List = ({ children, className }: { children: ReactNode; className?: string }) => (
  <View className={cn('border-border border-t-[1.5px]', className)}>{children}</View>
);

type ListRowProps = {
  /** Номер или значок слева, плакатным шрифтом */
  lead?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /** Значение или действие справа */
  trail?: ReactNode;
  /** Доп. содержимое под подписью: предупреждения, кнопки */
  children?: ReactNode;
  /** Вся строка нажимается: открывает шторку или экран */
  onPress?: () => void;
  /** Последняя строка группы (суперсета) — без нижней линейки */
  last?: boolean;
  className?: string;
};

// Строка списка между линейками — порт shared/ui/kit/ListRow.tsx: упражнения, программы, друзья, растяжки
export const ListRow = ({ lead, title, meta, trail, children, onPress, last, className }: ListRowProps) => {
  const row = cn(
    'border-border flex-row items-start gap-3 py-3.5',
    last ? 'border-b-0' : 'border-b-[1.5px]',
    onPress && 'active:bg-mist',
    className,
  );

  const content = (
    <>
      {lead != null && (
        <View className="min-w-7 pt-0.5">{typeof lead === 'string' ? <Poster tone="primary">{lead}</Poster> : lead}</View>
      )}
      <View className="min-w-0 flex-1">
        {typeof title === 'string' ? <Text size="lg">{title}</Text> : title}
        {meta ? (
          <Text size="xs" tone="muted" className="mt-1">
            {meta}
          </Text>
        ) : null}
        {children}
      </View>
      {trail != null && <View className="self-center">{trail}</View>}
    </>
  );

  if (!onPress) return <View className={row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      className={row}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      {content}
    </Pressable>
  );
};

type ListLinkRowProps = Omit<ListRowProps, 'trail' | 'onPress'> & { onPress: () => void };

// Строка-переход: нажимается целиком, справа стрелка
export const ListLinkRow = (props: ListLinkRowProps) => (
  <ListRow {...props} trail={<Icon as={ChevronRight} className="text-foreground/40 size-5" />} />
);
