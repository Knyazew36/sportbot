import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Trash2 } from 'lucide-react-native';

import { useDeleteWorkout } from '@sportbot/api/entities/workout';

import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Icon } from '@/shared/ui/kit/Icon';
import { StickyFooter } from '@/shared/ui/kit/Screen';

type WorkoutStatsFooterProps = {
  workoutId: number;
  back: Href;
};

export const WorkoutStatsFooter = ({ workoutId, back }: WorkoutStatsFooterProps) => {
  const remove = useDeleteWorkout();

  return (
    <StickyFooter>
      <View className="flex-1">
        <ShareWorkoutButton workoutId={workoutId} size="lg" block />
      </View>
      <ConfirmAction
        trigger={<Button variant="outline" size="lg" accessibilityLabel="Удалить тренировку" />}
        title="Удалить тренировку?"
        description="Подходы пропадут из статистики, а день в календаре станет пропуском."
        confirmLabel="Удалить"
        onConfirm={() => remove.mutateAsync(workoutId).then(() => router.dismissTo(back))}
      >
        <Icon as={Trash2} />
      </ConfirmAction>
    </StickyFooter>
  );
};
