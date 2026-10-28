import { Trash2 } from 'lucide-react-native';

import { type WorkoutItem } from '@sportbot/api/entities/workout';
import { useRemoveItem } from '@/shared/local/entities/workout';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Icon } from '@/shared/ui/kit/Icon';

// Лишнее упражнение в прошедшей тренировке: уходит вместе с подходами, графики пересчитаются
export const RemoveItemButton = ({ item }: { item: WorkoutItem }) => {
  const remove = useRemoveItem();
  return (
    <ConfirmAction
      trigger={<Button variant="ghost" size="icon-sm" accessibilityLabel={`Убрать «${item.name}» из тренировки`} />}
      title={`Убрать «${item.name}»?`}
      description={item.sets.length > 0 ? 'Подходы этого упражнения удалятся вместе с ним.' : undefined}
      confirmLabel="Убрать"
      onConfirm={() => remove.mutateAsync(item.id)}
    >
      <Icon as={Trash2} className="size-4" />
    </ConfirmAction>
  );
};
