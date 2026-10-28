import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useWorkoutSummary } from '@/shared/local/entities/workout';

import { ROUTES } from '@/shared/config/routes';
import { EXERCISE_OF_FORMS, SET_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { StatGrid } from '@/shared/ui/kit/StatGrid';
import { Text } from '@/shared/ui/kit/Typography';
import { CooldownOffer } from '@/widgets/workout/CooldownOffer';
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords';

const RECORDS_ON_TODAY = 3;

// Итог сегодняшней тренировки — порт WorkoutTotals.tsx: заминка следующим шагом, рекорды, цифры, протокол
export const WorkoutTotals = ({ workoutId, complexName }: { workoutId: number; complexName: string }) => {
  const summary = useWorkoutSummary(workoutId);

  return (
    <QueryState query={summary}>
      {(s) => (
        <>
          {/* Сделанную заминку не предлагаем повторно — как и напоминание на итоге */}
          {s.timing?.cooldownSeconds == null && (
            <Rise className="px-gutter">
              <CooldownOffer workoutId={workoutId} />
            </Rise>
          )}
          {s.records.length > 0 && (
            <ScreenSection title="Рекорды сегодня" aside={s.records.length}>
              <WorkoutRecords records={s.records} limit={RECORDS_ON_TODAY} />
            </ScreenSection>
          )}
          <ScreenSection title="Итог" aside={complexName}>
            {s.sets > 0 ? (
              <>
                <StatGrid
                  framed
                  items={[
                    { label: 'мин', value: s.minutes },
                    { label: pluralize(s.sets, SET_FORMS, { withCount: false }), value: s.sets },
                    { label: `из ${pluralize(s.exercisesTotal, EXERCISE_OF_FORMS)}`, value: s.exercisesDone },
                  ]}
                />
                {s.tonnage > 0 && (
                  <Text size="sm" tone="soft">
                    Поднято за тренировку: {s.tonnage.toLocaleString('ru-RU')} кг
                  </Text>
                )}
              </>
            ) : (
              <Text tone="soft">Засчитано без записи подходов — по плану.</Text>
            )}
            <ButtonLink
              href={{ pathname: ROUTES.WORKOUT_SUMMARY, params: { workoutId: String(workoutId) } }}
              variant="outline"
              iconRight={ArrowRight}
            >
              Протокол
            </ButtonLink>
          </ScreenSection>
        </>
      )}
    </QueryState>
  );
};
