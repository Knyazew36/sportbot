import { useMyEntriesCount } from '@/entities/catalog'
import { CountBadge } from '@/shared/ui/kit/CountBadge'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type MineButtonProps = {
  active: boolean
  onClick: () => void
}

// «Мои» в шапке справочника: свои записи и их заявки. Счётчик — сколько записей уже есть.
// Отрицательный отступ — кнопка не раздувает шапку
export const MineButton = ({ active, onClick }: MineButtonProps) => {
  const count = useMyEntriesCount()
  return (
    <Button
      type='button'
      variant={active ? 'default' : 'outline'}
      size='sm'
      aria-pressed={active}
      aria-label={count.data ? `Мои, записей: ${count.data}` : 'Мои'}
      className='relative -my-1.5'
      onClick={onClick}
    >
      Мои
      {!active && <CountBadge count={count.data ?? 0} />}
    </Button>
  )
}
