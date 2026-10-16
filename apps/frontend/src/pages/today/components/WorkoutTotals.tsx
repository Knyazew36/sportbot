import { ArrowRightIcon } from 'lucide-react'

import { useWorkoutSummary } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { EXERCISE_OF_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords'
import { pluralize } from '@front-cmdt/utils/pluralize'

const RECORDS_ON_TODAY = 3

// Итог сегодняшней тренировки: рекорды, цифры и переход к протоколу с заминкой
export const WorkoutTotals = ({ workoutId, complexName }: { workoutId: number; complexName: string }) => {
  const summary = useWorkoutSummary(workoutId)

  return (
    <QueryScreen
      query={summary}
      rows={2}
    >
      {s => (
        <>
          {s.records.length > 0 && (
            <ScreenSection
              title='Рекорды сегодня'
              aside={s.records.length}
            >
              <WorkoutRecords
                records={s.records}
                limit={RECORDS_ON_TODAY}
              />
            </ScreenSection>
          )}
          <ScreenSection
            title='Итог'
            aside={complexName}
          >
            {s.sets > 0 ? (
              <>
                <StatGrid
                  framed
                  items={[
                    { label: 'мин', value: s.minutes },
                    { label: pluralize(s.sets, SET_FORMS, { withCount: false }), value: s.sets },
                    {
                      label: `из ${pluralize(s.exercisesTotal, EXERCISE_OF_FORMS)}`,
                      value: s.exercisesDone,
                    },
                  ]}
                />
                {s.tonnage > 0 && (
                  <Text
                    size='sm'
                    tone='soft'
                  >
                    Поднято за тренировку: {s.tonnage.toLocaleString('ru-RU')} кг
                  </Text>
                )}
              </>
            ) : (
              <Text tone='soft'>Засчитано без записи подходов — по плану комплекса.</Text>
            )}
            <ButtonLink
              to={buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId })}
              variant='outline'
            >
              Протокол и заминка
              <ArrowRightIcon />
            </ButtonLink>
          </ScreenSection>
        </>
      )}
    </QueryScreen>
  )
}
