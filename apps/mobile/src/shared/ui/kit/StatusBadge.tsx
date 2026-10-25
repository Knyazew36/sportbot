import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { Text, TextClassContext } from './Typography';

// Статус не кодируется только цветом: у бейджа всегда есть иконка и текст — порт shared/ui/kit/StatusBadge.tsx
const statusBadgeVariants = cva('h-7 shrink-0 flex-row items-center gap-1.5 self-start rounded-full px-3', {
  variants: {
    tone: {
      // Текст на mint/voltage всегда чёрный: акцент одинаковый в обеих темах
      success: 'bg-success',
      attention: 'bg-attention',
      danger: 'bg-destructive/10',
      neutral: 'bg-mist',
      inverse: 'bg-foreground',
      outline: 'border-foreground border',
    },
    size: {
      default: '',
      sm: 'h-6 px-2.5',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'default' },
});

const TONE_TEXT: Record<StatusTone, string> = {
  success: 'text-black',
  attention: 'text-black',
  danger: 'text-destructive',
  neutral: 'text-slate',
  inverse: 'text-background',
  outline: 'text-foreground',
};

export type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>['tone']>;

export type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

export const StatusBadge = ({ tone, size, icon, children, className }: StatusBadgeProps) => {
  const textClass = TONE_TEXT[tone ?? 'neutral'];
  const small = size === 'sm';
  return (
    <TextClassContext.Provider value={textClass}>
      <View className={cn(statusBadgeVariants({ tone, size }), className)}>
        <Icon as={icon} className={cn('shrink-0', small ? 'size-3' : 'size-3.5')} />
        <Text medium size={small ? '2xs' : 'sm'} numberOfLines={1}>
          {children}
        </Text>
      </View>
    </TextClassContext.Provider>
  );
};

// Описание статуса как данных: сущности хранят словари «код → тон, иконка, подпись»
export type StatusMeta = { tone: StatusTone; icon: LucideIcon; label: string };

export const StatusFromMeta = ({
  meta,
  size,
  className,
}: { meta: StatusMeta } & Pick<StatusBadgeProps, 'size' | 'className'>) => (
  <StatusBadge tone={meta.tone} icon={meta.icon} size={size} className={className}>
    {meta.label}
  </StatusBadge>
);
