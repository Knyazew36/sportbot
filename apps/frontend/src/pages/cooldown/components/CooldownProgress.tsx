import { cn } from '@/shared/lib/utils'

type CooldownProgressProps = {
  ids: number[]
  current: number
  mainCount: number
}

// Пройденные и текущая залиты, «если есть время» — пунктиром
export const CooldownProgress = ({ ids, current, mainCount }: CooldownProgressProps) => (
  <div className='flex gap-1 px-gutter pt-3'>
    {ids.map((id, i) => (
      <span
        key={id}
        className={cn(
          'h-1 flex-1',
          i <= current ? 'bg-primary' : i < mainCount ? 'bg-border' : 'border-border border-t-2 border-dashed',
        )}
      />
    ))}
  </div>
)
