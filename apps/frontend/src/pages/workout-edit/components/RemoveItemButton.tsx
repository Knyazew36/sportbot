import { Trash2Icon } from 'lucide-react'

import { useRemoveItem, type WorkoutItem } from '@sportbot/api/entities/workout'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Лишнее упражнение в прошедшей тренировке: уходит вместе с подходами, графики пересчитаются
export const RemoveItemButton = ({ item }: { item: WorkoutItem }) => {
  const remove = useRemoveItem()
  const sets = item.sets.length

  return (
    <ConfirmAction
      trigger={
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`Убрать «${item.name}» из тренировки`}
        />
      }
      title={`Убрать «${item.name}»?`}
      description={sets > 0 ? 'Подходы этого упражнения удалятся вместе с ним.' : undefined}
      confirmLabel='Убрать'
      onConfirm={() => remove.mutateAsync(item.id)}
    >
      <Trash2Icon />
    </ConfirmAction>
  )
}
