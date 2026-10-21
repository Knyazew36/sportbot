import { Share2Icon } from 'lucide-react'

import { useShareProgram } from '@/entities/program'
import { notifySuccess } from '@/shared/lib/notify'
import { shareLink } from '@/shared/miniapp'
import { Button, type ButtonProps } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type ShareProgramButtonProps = {
  programId: number
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
  /** Короткая подпись, где рядом уже сказано, что делимся программой */
  label?: string
  className?: string
}

const LABEL = 'Поделиться с другом'

// Ссылка ведёт только на программу: открывший видит состав и забирает копию себе, дружба не нужна
export const ShareProgramButton = ({
  programId,
  size,
  variant = 'share',
  label = LABEL,
  className,
}: ShareProgramButtonProps) => {
  const share = useShareProgram()
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={share.isPending}
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
        className='size-4'
        strokeWidth={2.5}
      />
      {label}
    </Button>
  )
}
