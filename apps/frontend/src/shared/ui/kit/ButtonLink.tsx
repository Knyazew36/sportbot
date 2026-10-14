import type { VariantProps } from 'class-variance-authority'
import { Link } from 'react-router'

import type { ComponentProps, MouseEvent } from 'react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { buttonVariants } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Переход — тоже действие, поэтому у ссылки та же рамка и тень, что у кнопки.
// Внешний адрес (видео техники) открывается в новой вкладке обычной ссылкой, а не роутером
export const ButtonLink = ({
  variant,
  size,
  className,
  to,
  onClick,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) => {
  const classes = cn(buttonVariants({ variant, size }), className)
  // Вибрация как у кнопки: с виду это та же кнопка
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    haptic.tap()
    onClick?.(event)
  }

  if (typeof to === 'string' && /^https?:\/\//.test(to)) {
    return (
      <a
        href={to}
        target='_blank'
        rel='noopener noreferrer'
        className={classes}
        onClick={handleClick}
        {...props}
      />
    )
  }

  return (
    <Link
      to={to}
      className={classes}
      onClick={handleClick}
      {...props}
    />
  )
}
