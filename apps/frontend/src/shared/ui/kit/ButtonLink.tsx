import type { VariantProps } from 'class-variance-authority'
import { Link } from 'react-router'

import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Переход — тоже действие, поэтому у ссылки та же рамка и тень, что у кнопки.
// Внешний адрес (видео техники) открывается в новой вкладке обычной ссылкой, а не роутером
export const ButtonLink = ({
  variant,
  size,
  className,
  to,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) => {
  const classes = cn(buttonVariants({ variant, size }), className)

  if (typeof to === 'string' && /^https?:\/\//.test(to)) {
    return (
      <a
        href={to}
        target='_blank'
        rel='noopener noreferrer'
        className={classes}
        {...props}
      />
    )
  }

  return (
    <Link
      to={to}
      className={classes}
      {...props}
    />
  )
}
