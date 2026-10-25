import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

import { Eyebrow, TextClassContext } from './Typography';

// Метка-тег — Badge из React Native Reusables со стилем shared/ui/shadcn/badge.tsx фронта.
// Только для тегов (мышцы, оборудование), не для счётчиков и не для «День А»
const badgeVariants = cva('h-6 self-start flex-row items-center justify-center gap-1 border-[1.5px] px-2', {
  variants: {
    variant: {
      default: 'border-primary bg-primary',
      secondary: 'border-primary bg-accent',
      destructive: 'border-destructive',
      outline: 'border-foreground/70',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-primary',
      destructive: 'text-destructive',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeProps = VariantProps<typeof badgeVariants> & { children: string; className?: string };

export const Badge = ({ children, variant, className }: BadgeProps) => (
  <TextClassContext.Provider value={badgeTextVariants({ variant })}>
    <View className={cn(badgeVariants({ variant }), className)}>
      <Eyebrow size="sm" tone="inherit" numberOfLines={1}>
        {children}
      </Eyebrow>
    </View>
  </TextClassContext.Provider>
);
