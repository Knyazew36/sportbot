import { StarIcon } from 'lucide-react'

import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type StarsPresetTileProps = {
  amount: number
  caption?: string
  selected: boolean
  onSelect: () => void
}

// Готовая сумма: крупное число со звездой, под ним повод. Выбранная — в золоте, остальные нейтральные
export const StarsPresetTile = ({ amount, caption, selected, onSelect }: StarsPresetTileProps) => (
  <Button
    type='button'
    variant={selected ? 'gold' : 'outline'}
    aria-pressed={selected}
    className='h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left'
    onClick={onSelect}
  >
    <span className='flex items-center gap-1.5'>
      <Poster
        as='span'
        size='md'
        numeric
      >
        {amount}
      </Poster>
      <StarIcon
        className='size-4 fill-current'
        strokeWidth={2.5}
      />
    </span>
    {caption && (
      <Text
        as='span'
        size='2xs'
        tone={selected ? 'inherit' : 'muted'}
      >
        {caption}
      </Text>
    )}
  </Button>
)
