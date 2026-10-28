import { X } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { DayToday } from '@sportbot/api/entities/day';
import { useDiscardWorkout } from '@/shared/local/entities/workout';

import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Rise } from '@/shared/ui/kit/Reveal';
import { StatGrid } from '@/shared/ui/kit/StatGrid';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { WeekStreak } from './WeekStreak';

// Тренировка идёт — порт InProgressDay.tsx: начата в боте или приложении, продолжается где удобно (frontend-tz, 4.1)
export const InProgressDay = ({ day }: { day: DayToday }) => {
  const workout = day.workout!;
  const discard = useDiscardWorkout();

  return (
    <>
      <Rise className="px-gutter">
        <Lead>сейчас —</Lead>
        <Poster size="4xl" tone="primary" numberOfLines={2} adjustsFontSizeToFit className="mt-1">
          {workout.complexName}
        </Poster>
        <StatGrid
          className="mt-4"
          items={[
            { label: 'сделано', value: workout.done },
            { label: 'из', value: workout.total },
          ]}
        />
      </Rise>
      <WeekStreak week={day.week} withAttendance />
      {/* Отмена — как «Отменить» в боте: тренировка удаляется, очередь тренировок не сдвигается */}
      <Rise className="px-gutter">
        <ConfirmAction
          trigger={<Button variant="destructive" block icon={X} />}
          title="Отменить тренировку?"
          description={
            workout.done
              ? `Записанные подходы (${workout.done} из ${pluralize(workout.total, EXERCISE_OF_FORMS)}) удалятся. Очередь тренировок не сдвинется.`
              : 'Тренировка удалится, очередь тренировок не сдвинется.'
          }
          confirmLabel="Отменить тренировку"
          onConfirm={() => discard.mutateAsync(workout.id)}
        >
          Отменить тренировку
        </ConfirmAction>
      </Rise>
    </>
  );
};
