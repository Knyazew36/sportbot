import type { WorkoutSummary } from '@/entities/workout'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

// Объём тренировки строкой между линейками. Серия ушла в плашку с медалью — здесь не повторяется,
// а тоннаж стал полноценной цифрой вместо подписи мелким шрифтом
export const SummaryStats = ({ summary }: { summary: WorkoutSummary }) => (
  <Rise className='px-gutter'>
    <StatGrid
      items={[
        { label: pluralize(summary.sets, SET_FORMS, { withCount: false }), value: summary.sets },
        {
          label: pluralize(summary.exercisesTotal, EXERCISE_FORMS, { withCount: false }),
          value: `${summary.exercisesDone}/${summary.exercisesTotal}`,
        },
        ...(summary.tonnage > 0 ? [{ label: 'кг поднято', value: summary.tonnage.toLocaleString('ru-RU') }] : []),
      ]}
    />
    {summary.cardioName && (
      <Text
        size='sm'
        tone='soft'
        className='mt-3'
      >
        Кардио в конце: {summary.cardioName}
        {summary.cardioMinutes ? `, ${summary.cardioMinutes} мин` : ''}
      </Text>
    )}
  </Rise>
)
