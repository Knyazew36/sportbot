'use client';

import type * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from '@/shared/ui/shadcn/animate-ui/primitives/buttons/button';
import { cn } from '@/shared/lib/utils';

// Варианты по DESIGN.md: primary — чёрная 8px, outline — 1.5px slate 4px, без теней
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-body font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-graphite dark:hover:bg-slate',
        outline:
          'rounded-sm border-[1.5px] border-slate bg-transparent text-slate hover:border-foreground hover:text-foreground aria-expanded:border-foreground aria-expanded:text-foreground',
        secondary: 'bg-paper text-foreground hover:bg-mist aria-expanded:bg-mist',
        accent: 'bg-success text-black hover:bg-success/80',
        ghost:
          'text-slate hover:bg-mist hover:text-foreground aria-expanded:bg-mist aria-expanded:text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'rounded-sm text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 gap-2 px-6 has-[>svg]:px-5',
        xs: "h-7 gap-1 px-2.5 text-caption has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 gap-1.5 px-4 text-body-sm has-[>svg]:px-3',
        lg: 'h-14 gap-2 px-8 has-[>svg]:px-6',
        icon: 'size-11',
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-9',
        'icon-lg': 'size-14',
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

// Рабочий кабинет плотный: увеличение при наведении мешает, оставляем только лёгкий отклик на нажатие
function Button({ className, variant, size, hoverScale = 1, tapScale = 0.98, ...props }: ButtonProps) {
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
