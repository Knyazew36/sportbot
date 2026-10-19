import { Share2Icon } from 'lucide-react'

import { useShareProgram } from '@/entities/program'
import { cn } from '@/shared/lib/utils'
import { notifySuccess } from '@/shared/lib/notify'
import { shareLink } from '@/shared/miniapp'
import { Button, type ButtonProps } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type ShareProgramButtonProps = {
  programId: number
  size?: ButtonProps['size']
  /** Квадратная кнопка с одной иконкой — рядом с «Редактировать», где на подпись нет места */
  iconOnly?: boolean
  className?: string
}

const LABEL = 'Поделиться с другом'

// Ссылка ведёт только на программу: открывший видит состав и забирает копию себе, дружба не нужна
export const ShareProgramButton = ({ programId, size, iconOnly, className }: ShareProgramButtonProps) => {
  const share = useShareProgram()
  return (
    <Button
      variant='share'
      size={size}
      className={cn(iconOnly && 'aspect-square shrink-0 px-0', className)}
      disabled={share.isPending}
      aria-label={iconOnly ? LABEL : undefined}
      onClick={() =>
        share.mutate(programId, {
          onSuccess: async link => {
            // Где штатного «Поделиться» нет, ссылка копируется — об этом стоит сказать
            if ((await shareLink(link.url, link.text)) === 'copied') notifySuccess('Ссылка скопирована')()
          },
        })
      }
    >
      <Share2Icon
        className={iconOnly ? 'size-5' : 'size-4'}
        strokeWidth={2.5}
      />
      {!iconOnly && LABEL}
    </Button>
  )
}
