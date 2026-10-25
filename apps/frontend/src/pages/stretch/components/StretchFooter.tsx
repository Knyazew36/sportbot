import { BanIcon, CheckIcon, PencilLineIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react'

import type { CatalogStretch } from '@sportbot/api/entities/catalog'
import { useCreateStretchExclusion, useIsStretchExcluded } from '@sportbot/api/entities/stretch-exclusion'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { HoldControls } from '@/widgets/catalog/HoldControls'

type StretchFooterProps = {
  stretch: CatalogStretch
  /** 0 — таймер не запущен, 1 и 2 — сторона */
  side: 0 | 1 | 2
  onSide: (side: 0 | 1 | 2) => void
  onEdit: () => void
}

// «Попробовать» запускает таймер удержания, как в заминке; до запуска — правка и «не предлагать»
export const StretchFooter = ({ stretch: s, side, onSide, onEdit }: StretchFooterProps) => {
  const excluded = useIsStretchExcluded(s.id)
  const exclude = useCreateStretchExclusion()

  if (side !== 0)
    return (
      <HoldControls
        key={side}
        holdSeconds={s.holdSeconds}
        side={s.perSide ? side : undefined}
        autoStart
        back={{ label: 'Сбросить', icon: RotateCcwIcon, onClick: () => onSide(0) }}
        next={
          s.perSide && side === 1
            ? { label: 'Левая', icon: SkipForwardIcon, onClick: () => onSide(2) }
            : { label: 'Готово', icon: CheckIcon, onClick: () => onSide(0) }
        }
      />
    )

  return (
    <StickyFooter>
      <Button
        variant='outline'
        size='icon-lg'
        className='size-[60px]'
        onClick={onEdit}
        aria-label='Предложить правку'
      >
        <PencilLineIcon className='size-6' />
      </Button>
      {/* Исключённую возвращают из строки под названием — тут кнопка только «убрать» */}
      {!excluded && (
        <Button
          variant='outline'
          size='icon-lg'
          className='size-[60px]'
          disabled={exclude.isPending}
          onClick={() => exclude.mutate(s.id)}
          aria-label='Не предлагать в заминке'
        >
          <BanIcon className='size-6' />
        </Button>
      )}
      <Button
        size='lg'
        onClick={() => onSide(1)}
      >
        <PlayIcon className='size-6' />
        Попробовать
      </Button>
    </StickyFooter>
  )
}
