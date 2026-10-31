import { Share2 } from 'lucide-react-native';

import { useShareWorkout } from '@/shared/local/entities/workout';

import { useOnlineAction } from '@/shared/lib/hooks/use-online-action';
import { Button, type ButtonSize } from '@/shared/ui/kit/Button';

type ShareWorkoutButtonProps = {
  workoutId: number;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  contentClassName?: string;
  /** Квадратная кнопка без подписи: в тесном футере */
  iconOnly?: boolean;
};

// Карточку присылает бот — порт features/share-workout: её можно переслать в любой чат,
// а кнопка в ней откроет страницу результата. Нативный «Поделиться» картинкой — этап 2 (MOBILE_TZ.md, раздел 6)
export const ShareWorkoutButton = ({ workoutId, size, block, className, contentClassName, iconOnly }: ShareWorkoutButtonProps) => {
  const share = useShareWorkout();
  const net = useOnlineAction();
  return (
    <Button
      variant="share"
      size={iconOnly ? 'icon-lg' : size}
      block={block}
      accessibilityLabel="Поделиться"
      className={className}
      contentClassName={contentClassName}
      // Картинку сервер рисует несколько секунд — без индикатора кажется, что нажатие не сработало
      loading={share.isPending}
      disabled={net.disabled}
      icon={Share2}
      onPress={() => share.mutate(workoutId)}
    >
      {iconOnly ? null : share.isPending ? 'Готовим карточку…' : net.label('Поделиться')}
    </Button>
  );
};
