'use client';

import type * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from '@/shared/ui/shadcn/animate-ui/primitives/buttons/button';
import { cn } from '@/shared/lib/utils';

// Кнопка Спортбота: рамка и жёсткая тень. Тень — единственный признак «нажимается», у информационных
// блоков её нет, поэтому в зале с одного взгляда видно, куда тыкать. При нажатии кнопка садится на место тени.
// Цвет тени задаёт вариант через --press, величину сдвига — размер
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border-[1.5px] whitespace-nowrap outline-none select-none transition-[translate,box-shadow,background-color,color] duration-100 active:shadow-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'border-foreground bg-primary text-primary-foreground [--press:var(--sb-ink)]',
        ink: 'border-foreground bg-foreground text-background [--press:var(--sb-blue)]',
        outline:
          'border-foreground bg-background text-foreground [--press:var(--sb-ink)] aria-expanded:bg-accent',
        // Предупреждение тоже кнопка (открывает пояснение), но в синем, чтобы не спорить с главными действиями
        alert: 'border-primary bg-background text-primary [--press:var(--sb-blue)]',
        // На чёрной плашке тень синяя: чёрная там не видна
        paper: 'border-background bg-background text-foreground [--press:var(--sb-blue)]',
        destructive: 'border-destructive bg-background text-destructive [--press:var(--sb-danger)]',
        // Шаблонные варианты кабинета сведены к тем же голосам
        secondary: 'border-foreground bg-background text-foreground [--press:var(--sb-ink)]',
        accent: 'border-foreground bg-primary text-primary-foreground [--press:var(--sb-ink)]',
        // Без тени: только служебные действия внутри плотных списков кабинета
        ghost:
          'border-transparent text-muted-foreground shadow-none! translate-none! hover:bg-muted hover:text-foreground aria-expanded:bg-muted',
        link: 'border-transparent text-primary underline-offset-4 shadow-none! translate-none! hover:underline',
      },
      size: {
        xs: "h-7 px-2.5 text-[12px] shadow-[2px_2px_0_var(--press)] active:translate-[2px] [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 px-3.5 text-[13px] shadow-[2px_2px_0_var(--press)] active:translate-[2px]',
        default: 'sb-poster h-12 px-5 text-[18px] shadow-[3px_3px_0_var(--press)] active:translate-[3px]',
        lg: 'sb-poster h-[60px] px-6 text-[22px] shadow-[4px_4px_0_var(--press)] active:translate-[4px]',
        // Главное действие экрана: крупная цель под большой палец
        xl: 'sb-poster h-[68px] px-7 text-[26px] tracking-[0.01em] shadow-[4px_4px_0_var(--press)] active:translate-[4px]',
        icon: 'size-10 shadow-[2px_2px_0_var(--press)] active:translate-[2px]',
        'icon-xs': "size-7 shadow-[2px_2px_0_var(--press)] active:translate-[2px] [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-9 shadow-[2px_2px_0_var(--press)] active:translate-[2px]',
        'icon-lg': 'size-14 shadow-[3px_3px_0_var(--press)] active:translate-[3px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// Снаружи — обычные props <button>: motion-типы (onAnimationStart и т.п.) несовместимы с DOM-событиями,
// из-за чего кнопку нельзя было бы передать в render/asChild других примитивов
type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    hoverScale?: number;
    tapScale?: number;
  };

// Масштаб при нажатии выключен: отклик даёт посадка на тень, второй эффект её смазывает
function Button({ className, variant, size, hoverScale = 1, tapScale = 1, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      hoverScale={hoverScale}
      tapScale={tapScale}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(props as ButtonPrimitiveProps)}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
