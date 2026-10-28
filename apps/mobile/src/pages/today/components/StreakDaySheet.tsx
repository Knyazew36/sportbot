import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useStatsDay } from '@/shared/local/entities/stats';

import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton';
import { ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow } from '@/shared/ui/kit/Typography';
import { DayWorkout } from '@/widgets/stats/DayWorkout';

type StreakDaySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Остаётся заданной и после закрытия, чтобы шторка не опустела на анимации */
  date: string | null;
};

// Тренировки дня из серии — порт StreakDaySheet.tsx: что делали, поделиться и перейти к полной странице
export const StreakDaySheet = ({ open, onOpenChange, date }: StreakDaySheetProps) => {
  const day = useStatsDay(date);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={formatDate(date, 'd MMMM')}
      description={<Eyebrow tone="primary">{formatDate(date, 'EEEE')}</Eyebrow>}
    >
      <QueryState query={day}>
        {(d) => (
          <View>
            {d.workouts.map((w, i) => (
              <View
                key={w.id}
                className={cn('border-border gap-3 pb-4', i > 0 && 'border-t-[1.5px] pt-4')}
              >
                <DayWorkout workout={w} />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <ShareWorkoutButton workoutId={w.id} size="sm" block />
                  </View>
                  <View className="flex-1">
                    <ButtonLink
                      href={{ pathname: ROUTES.STATS_WORKOUT, params: { workoutId: String(w.id) } }}
                      variant="outline"
                      size="sm"
                      block
                      iconRight={ChevronRight}
                      onNavigate={() => onOpenChange(false)}
                    >
                      Подробнее
                    </ButtonLink>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </QueryState>
    </Sheet>
  );
};
