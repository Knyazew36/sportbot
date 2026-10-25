import { Children, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { TextClassContext } from './Typography';
import { Pressable } from './Pressable';

// Кнопка Спортбота — порт shared/ui/shadcn/animate-ui/components/buttons/button.tsx на основе Button из
// React Native Reusables. Рамка и жёсткая тень: тень — единственный признак «нажимается».
// При нажатии кнопка садится на место тени. Тень — отдельный блок под кнопкой: box-shadow со сдвигом
// и без размытия в RN рисуется по-разному на iOS и Android

const buttonVariants = cva('flex-row items-center justify-center gap-2 border-[1.5px]', {
  variants: {
    variant: {
      default: 'border-foreground bg-primary',
      ink: 'border-foreground bg-foreground',
      outline: 'border-foreground bg-background',
      // Предупреждение тоже кнопка, но в синем, чтобы не спорить с главными действиями
      alert: 'border-primary bg-background',
      // На чёрной плашке тень синяя: чёрная там не видна
      paper: 'border-background bg-background',
      destructive: 'border-destructive bg-background',
      // Зелёный «можно»: тренировка вне очереди, подтверждённый успех
      success: 'border-foreground bg-success',
      // Идёт отдых: тот же абрикосовый, что у живой полосы во время отдыха
      rest: 'border-foreground bg-rest',
      // Золото — «спасибо»: тихое, не спорит с синими действиями
      gold: 'border-sb-gold bg-background',
      // «Наружу» — всё, что увидят другие люди: чернильная плашка, золотая тень
      share: 'border-foreground bg-foreground',
      ghost: 'border-transparent',
      link: 'border-transparent',
    },
    size: {
      xs: 'min-h-7 px-2.5 py-1',
      sm: 'min-h-9 px-3.5 py-1',
      default: 'min-h-12 px-5 py-1.5',
      lg: 'min-h-[60px] px-6 py-2',
      xl: 'min-h-[68px] px-7 py-2',
      icon: 'size-10',
      'icon-xs': 'size-7',
      'icon-sm': 'size-9',
      'icon-lg': 'size-14',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

// Цвет подписи и иконок — через TextClassContext, как в Reusables
const buttonTextVariants = cva('font-display uppercase text-center shrink', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      ink: 'text-background',
      outline: 'text-foreground',
      alert: 'text-primary',
      paper: 'text-foreground',
      destructive: 'text-destructive',
      success: 'text-black',
      rest: 'text-black',
      gold: 'text-sb-gold',
      share: 'text-background',
      ghost: 'text-muted-foreground',
      link: 'text-primary',
    },
    size: {
      xs: 'text-[13px] leading-[14.3px] tracking-[0.13px]',
      sm: 'text-[15px] leading-[16.5px] tracking-[0.15px]',
      default: 'text-[18px] leading-[19.8px] tracking-[-0.36px]',
      lg: 'text-[22px] leading-[24.2px] tracking-[-0.44px]',
      xl: 'text-[26px] leading-[28.6px] tracking-[0.26px]',
      icon: '',
      'icon-xs': '',
      'icon-sm': '',
      'icon-lg': '',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

// Цвет тени по варианту — --press фронта
const PRESS: Record<ButtonVariant, string> = {
  default: 'bg-sb-ink',
  ink: 'bg-sb-blue',
  outline: 'bg-sb-ink',
  alert: 'bg-sb-blue',
  paper: 'bg-sb-blue',
  destructive: 'bg-sb-danger',
  success: 'bg-sb-ink',
  rest: 'bg-sb-ink',
  gold: 'bg-sb-gold',
  share: 'bg-sb-gold',
  ghost: '',
  link: '',
};

// Цвет индикатора загрузки = цвет подписи варианта
const SPINNER: Record<ButtonVariant, string> = {
  default: 'accent-primary-foreground',
  ink: 'accent-background',
  outline: 'accent-foreground',
  alert: 'accent-primary',
  paper: 'accent-foreground',
  destructive: 'accent-destructive',
  success: 'accent-black',
  rest: 'accent-black',
  gold: 'accent-sb-gold',
  share: 'accent-background',
  ghost: 'accent-muted-foreground',
  link: 'accent-primary',
};

// Сдвиг тени и посадки по размеру
const SHIFT: Record<ButtonSize, string> = {
  xs: 'translate-x-[2px] translate-y-[2px]',
  sm: 'translate-x-[2px] translate-y-[2px]',
  default: 'translate-x-[3px] translate-y-[3px]',
  lg: 'translate-x-[4px] translate-y-[4px]',
  xl: 'translate-x-[4px] translate-y-[4px]',
  icon: 'translate-x-[2px] translate-y-[2px]',
  'icon-xs': 'translate-x-[2px] translate-y-[2px]',
  'icon-sm': 'translate-x-[2px] translate-y-[2px]',
  'icon-lg': 'translate-x-[3px] translate-y-[3px]',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  default: 'size-[18px]',
  lg: 'size-[26px]',
  xl: 'size-7',
  icon: 'size-5',
  'icon-xs': 'size-3.5',
  'icon-sm': 'size-4',
  'icon-lg': 'size-6',
};

type ButtonVariants = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariants['variant']>;
export type ButtonSize = NonNullable<ButtonVariants['size']>;

export type ButtonProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Иконка перед подписью — красится цветом подписи */
  icon?: LucideIcon;
  /** Иконка после подписи: стрелка «дальше» */
  iconRight?: LucideIcon;
  /** На всю ширину родителя */
  block?: boolean;
  /** Подпись слева, иконка справа — у широких кнопок-переходов */
  spread?: boolean;
  disabled?: boolean;
  /** Индикатор загрузки: блокирует нажатие */
  loading?: boolean;
  onPress?: () => void;
  /** Раскладка снаружи: отступы, flex */
  className?: string;
  /** Раскладка внутри рамки: выравнивание и отступы содержимого (кнопка-вариант списка) */
  contentClassName?: string;
  accessibilityLabel?: string;
};

export const Button = ({
  children,
  variant = 'default',
  size = 'default',
  icon,
  iconRight,
  block,
  spread,
  disabled,
  loading,
  onPress,
  className,
  contentClassName,
  accessibilityLabel,
}: ButtonProps) => {
  const flat = variant === 'ghost' || variant === 'link';
  const textClass = buttonTextVariants({ variant, size });
  // У «Поделиться» иконка золотая на чернильном — как блик медали во фронте
  const iconClass = cn(ICON_SIZE[size], variant === 'share' && 'text-sb-gold-on-ink');

  // Строки среди детей — подписью кнопки, остальное (иконки, счётчики) — как есть
  const content = Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <Text className={textClass}>{child}</Text> : child,
  );

  return (
    <TextClassContext.Provider value={textClass}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={() => {
          haptic.tap();
          onPress?.();
        }}
        className={cn(block ? 'self-stretch' : 'self-start', className)}
      >
        {({ pressed }) => (
          // grow: высота и ширина, заданные снаружи (h-24, flex-1), доходят до рамки — иначе рамка остаётся по содержимому
          <View className="grow">
            {!flat && <View className={cn('absolute inset-0', PRESS[variant], SHIFT[size], disabled && 'opacity-30')} />}
            <View
              className={cn(
                'grow',
                buttonVariants({ variant, size }),
                spread && 'justify-between',
                pressed && !disabled && !flat && SHIFT[size],
                disabled && 'opacity-40',
                contentClassName,
              )}
            >
              {loading ? (
                <ActivityIndicator size="small" colorClassName={SPINNER[variant]} />
              ) : icon ? (
                <Icon as={icon} strokeWidth={2.5} className={iconClass} />
              ) : null}
              {content}
              {iconRight ? <Icon as={iconRight} strokeWidth={2.5} className={iconClass} /> : null}
            </View>
          </View>
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
};
