import { GlobeIcon, PencilIcon } from 'lucide-react'

import { isPublishable, type Program } from '@sportbot/api/entities/program'
import { ShareProgramButton } from '@/features/share-program/ShareProgramButton'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type ShowOthersProps = {
  program: Program
  onPublish: () => void
  size?: ButtonProps['size']
  className?: string
}

// Оба пути наружу рядом: всем — в каталог, другу — ссылкой. «Медаль» всегда одна:
// черновик зовёт в каталог, а уже отправленную остаётся только раздавать друзьям
export const ShowOthers = ({ program: p, onPublish, size, className }: ShowOthersProps) => {
  const publishable = isPublishable(p)
  const toCatalog = publishable && (p.publication === 'DRAFT' || p.publication === 'REJECTED')

  return (
    <div className={cn('flex gap-2', className)}>
      {publishable && (
        <Button
          variant={toCatalog ? 'share' : 'outline'}
          size={size}
          className='min-w-0 flex-1 px-3'
          onClick={onPublish}
        >
          {toCatalog ? <GlobeIcon /> : <PencilIcon />}
          {p.publication === 'DRAFT' ? 'В каталог' : p.publication === 'REJECTED' ? 'Исправить' : 'Описание'}
        </Button>
      )}
      <ShareProgramButton
        programId={p.id}
        size={size}
        variant={toCatalog ? 'outline' : 'share'}
        label={publishable ? 'Другу' : 'Поделиться с другом'}
        className={publishable ? 'min-w-0 flex-1 px-3' : 'w-full'}
      />
    </div>
  )
}
